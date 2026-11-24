import mongoose from "mongoose";
import { BanksDetailModel } from "./banksDetail.model.js";
import { IBanksDetail } from "./banksDetail.interface.js";
import { IJwtPayload } from "../user/user.interface.js";
import { UserModel } from "../user/user.model.js";

const createErrorWithStatus = (message: string, statusCode: number) => {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const ensureOwnershipOrAdmin = (bankDoc: IBanksDetail, requester: IJwtPayload) => {
  const isAdmin = requester.role?.toLowerCase() === "admin";
  const ownerId =
    typeof bankDoc.user === "object" && bankDoc.user !== null && "_id" in bankDoc.user
      ? String((bankDoc.user as any)._id)
      : String(bankDoc.user);

  if (!isAdmin && ownerId !== String(requester.userId)) {
    throw createErrorWithStatus("Forbidden: You do not have permission to access this bank detail", 403);
  }
};

const resolveTargetOwnerId = async (requestedUserId: any, requester: IJwtPayload) => {
  const isAdmin = requester.role?.toLowerCase() === "admin";
  if (!isAdmin || !requestedUserId) {
    return requester.userId;
  }

  if (!mongoose.isValidObjectId(requestedUserId)) {
    throw createErrorWithStatus("Invalid target user ID", 400);
  }

  const targetUser = await UserModel.findById(requestedUserId).select("_id");
  if (!targetUser) {
    throw createErrorWithStatus("Selected owner user not found", 404);
  }

  return targetUser._id;
};

const createBankDetailIntoDB = async (
  payload: Partial<IBanksDetail>,
  requester: IJwtPayload
) => {
  const isCash = payload.bankName?.trim().toLowerCase() === "cash";
  const { user, currentBalance, transactions, ...rest } = payload as any;

  const ownerId = await resolveTargetOwnerId(user, requester);

  const dataToCreate = {
    ...rest,
    user: ownerId,
    bankName: isCash ? "Cash" : payload.bankName?.trim(),
    accountNo: isCash ? payload.accountNo?.trim() || "" : payload.accountNo?.trim(),
    currentBalance: 0,
    transactions: [],
  };

  const created = await BanksDetailModel.create(dataToCreate);
  return await created.populate("user", "name email role");
};

const getAllBankDetailsFromDB = async (requester: IJwtPayload) => {
  const isAdmin = requester.role?.toLowerCase() === "admin";
  const filter = isAdmin ? {} : { user: requester.userId };

  return await BanksDetailModel.find(filter)
    .populate("user", "name email role")
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName")
    .sort({ createdAt: -1 });
};

const getSingleBankDetailFromDB = async (id: string, requester: IJwtPayload) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createErrorWithStatus("Invalid bank detail ID", 400);
  }

  const bankDoc = await BanksDetailModel.findById(id)
    .populate("user", "name email role")
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName");

  if (!bankDoc) {
    throw createErrorWithStatus("Bank detail not found", 404);
  }

  ensureOwnershipOrAdmin(bankDoc, requester);
  return bankDoc;
};

const updateBankDetailIntoDB = async (
  id: string,
  payload: Partial<IBanksDetail>,
  requester: IJwtPayload
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createErrorWithStatus("Invalid bank detail ID", 400);
  }

  const existingBank = await BanksDetailModel.findById(id);
  if (!existingBank) {
    throw createErrorWithStatus("Bank detail not found", 404);
  }

  ensureOwnershipOrAdmin(existingBank, requester);

  const { user, currentBalance, transactions, ...safePayload } = payload as any;
  const isAdmin = requester.role?.toLowerCase() === "admin";

  if (isAdmin && user) {
    safePayload.user = await resolveTargetOwnerId(user, requester);
  }

  const targetBankName = (safePayload.bankName ?? existingBank.bankName)?.trim();
  const isCash = targetBankName?.toLowerCase() === "cash";

  if (isCash) {
    safePayload.bankName = "Cash";
    if (safePayload.accountNo !== undefined) {
      safePayload.accountNo = safePayload.accountNo.trim();
    }
  } else {
    const nextAccountNo =
      safePayload.accountNo !== undefined
        ? safePayload.accountNo.trim()
        : existingBank.accountNo?.trim();

    if (!nextAccountNo) {
      throw createErrorWithStatus("Account number is required for non-cash accounts", 400);
    }
    if (safePayload.accountNo !== undefined) {
      safePayload.accountNo = nextAccountNo;
    }
  }

  return await BanksDetailModel.findByIdAndUpdate(id, safePayload, {
    new: true,
    runValidators: true,
  }).populate("user", "name email role");
};

const deleteBankDetailFromDB = async (id: string, requester: IJwtPayload) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createErrorWithStatus("Invalid bank detail ID", 400);
  }

  const existingBank = await BanksDetailModel.findById(id);
  if (!existingBank) {
    throw createErrorWithStatus("Bank detail not found", 404);
  }

  ensureOwnershipOrAdmin(existingBank, requester);

  return await BanksDetailModel.findByIdAndDelete(id);
};

// Transfer balance between any two accounts (Cash or Bank/bKash etc.)
const transferBalanceBetweenBanksInDB = async (payload: {
  fromBankId: string;
  toBankId: string;
  amount: number;
  date?: string;
  note?: string;
}) => {
  const { fromBankId, toBankId, amount, date, note } = payload;

  if (!mongoose.isValidObjectId(fromBankId) || !mongoose.isValidObjectId(toBankId)) {
    throw new Error("Invalid account ID");
  }

  if (fromBankId === toBankId) {
    throw new Error("Source and destination accounts must be different");
  }

  const transferAmount = Number(amount);
  if (!transferAmount || transferAmount <= 0) {
    throw new Error("Transfer amount must be greater than 0");
  }

  const fromBank = await BanksDetailModel.findById(fromBankId);
  if (!fromBank) {
    throw new Error("Source account not found");
  }

  const toBank = await BanksDetailModel.findById(toBankId);
  if (!toBank) {
    throw new Error("Destination account not found");
  }

  const currentFromBalance = Number(fromBank.currentBalance) || 0;
  if (transferAmount > currentFromBalance) {
    throw new Error(
      `Insufficient balance. Available balance is ${currentFromBalance}, requested ${transferAmount}`
    );
  }

  const txDate = date ? new Date(date) : new Date();
  const txNote = note || "";

  fromBank.currentBalance = currentFromBalance - transferAmount;
  fromBank.transactions.push({
    bankAccount: fromBank._id as any,
    type: "transfer_out",
    direction: "out",
    amount: transferAmount,
    date: txDate,
    fromAccount: fromBank._id as any,
    toAccount: toBank._id as any,
    referenceId: null,
    note: txNote,
  });

  toBank.currentBalance = (Number(toBank.currentBalance) || 0) + transferAmount;
  toBank.transactions.push({
    bankAccount: toBank._id as any,
    type: "transfer_in",
    direction: "in",
    amount: transferAmount,
    date: txDate,
    fromAccount: fromBank._id as any,
    toAccount: toBank._id as any,
    referenceId: null,
    note: txNote,
  });

  await fromBank.save();
  await toBank.save();

  const updatedFromBank = await BanksDetailModel.findById(fromBank._id)
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName");

  const updatedToBank = await BanksDetailModel.findById(toBank._id)
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName");

  return {
    fromAccount: updatedFromBank,
    toAccount: updatedToBank,
  };
};

// Deposit from Sales Order payment into Cash or Bank account
const recordSalesDepositIntoBank = async (params: {
  bankId: any;
  amount: number;
  date?: Date;
  referenceId?: any;
  note?: string;
}) => {
  const { bankId, amount, date, referenceId, note } = params;
  const depositAmount = Number(amount) || 0;
  if (!bankId || depositAmount <= 0) return;

  const bankDoc = await BanksDetailModel.findById(bankId);
  if (!bankDoc) return;

  bankDoc.currentBalance = (Number(bankDoc.currentBalance) || 0) + depositAmount;
  bankDoc.transactions.push({
    bankAccount: bankDoc._id as any,
    type: "deposit",
    direction: "in",
    amount: depositAmount,
    date: date || new Date(),
    fromAccount: null,
    toAccount: bankDoc._id as any,
    referenceId: referenceId || null,
    note: note || "Sales order payment deposit",
  });

  await bankDoc.save();
};

// Deduct expense amount from bank/cash account
const recordExpenseOutFromBank = async (params: {
  bankId: any;
  amount: number;
  date?: Date;
  referenceId?: any;
  note?: string;
}) => {
  const { bankId, amount, date, referenceId, note } = params;
  const expenseAmount = Number(amount);

  if (!mongoose.isValidObjectId(bankId)) {
    throw createErrorWithStatus("Invalid paidFrom bank account ID", 400);
  }
  if (!expenseAmount || expenseAmount <= 0) {
    throw createErrorWithStatus("Expense amount must be greater than 0", 400);
  }

  const bankDoc = await BanksDetailModel.findById(bankId);
  if (!bankDoc) {
    throw createErrorWithStatus("PaidFrom account not found", 404);
  }

  const availableBalance = Number(bankDoc.currentBalance) || 0;
  if (expenseAmount > availableBalance) {
    throw createErrorWithStatus(
      `Insufficient balance in ${bankDoc.bankName} (${bankDoc.accountName}). Available: ${availableBalance}, Required: ${expenseAmount}`,
      400
    );
  }

  bankDoc.currentBalance = availableBalance - expenseAmount;
  bankDoc.transactions.push({
    bankAccount: bankDoc._id as any,
    type: "expense",
    direction: "out",
    amount: expenseAmount,
    date: date || new Date(),
    fromAccount: bankDoc._id as any,
    toAccount: null,
    referenceId: referenceId || null,
    note: note || "Expense recorded",
  });

  await bankDoc.save();
  return bankDoc;
};

// Refund/rollback expense amount into bank/cash account
const refundExpenseIntoBank = async (params: {
  bankId: any;
  amount: number;
  date?: Date;
  referenceId?: any;
  note?: string;
}) => {
  const { bankId, amount, date, referenceId, note } = params;
  const refundAmount = Number(amount);
  if (!bankId || !refundAmount || refundAmount <= 0) return;

  const bankDoc = await BanksDetailModel.findById(bankId);
  if (!bankDoc) return;

  bankDoc.currentBalance = (Number(bankDoc.currentBalance) || 0) + refundAmount;
  bankDoc.transactions.push({
    bankAccount: bankDoc._id as any,
    type: "deposit",
    direction: "in",
    amount: refundAmount,
    date: date || new Date(),
    fromAccount: null,
    toAccount: bankDoc._id as any,
    referenceId: referenceId || null,
    note: note || "Expense reversed/deleted adjustment",
  });

  await bankDoc.save();
};

export const BanksDetailServices = {
  createBankDetailIntoDB,
  getAllBankDetailsFromDB,
  getSingleBankDetailFromDB,
  updateBankDetailIntoDB,
  deleteBankDetailFromDB,
  transferBalanceBetweenBanksInDB,
  recordSalesDepositIntoBank,
  recordExpenseOutFromBank,
  refundExpenseIntoBank,
};