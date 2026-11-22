import mongoose from "mongoose";
import { BanksDetailModel } from "./banksDetail.model.js";
import { IBanksDetail } from "./banksDetail.interface.js";

const createBankDetailIntoDB = async (payload: Partial<IBanksDetail>) => {
  const isCash = payload.bankName?.trim().toLowerCase() === "cash";
  const dataToCreate = {
    ...payload,
    bankName: isCash ? "Cash" : payload.bankName?.trim(),
    accountNo: isCash ? payload.accountNo?.trim() || "" : payload.accountNo?.trim(),
    currentBalance: 0,
    transactions: [],
  };
  return await BanksDetailModel.create(dataToCreate);
};

const getAllBankDetailsFromDB = async () => {
  return await BanksDetailModel.find()
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName")
    .sort({ createdAt: -1 });
};

const getSingleBankDetailFromDB = async (id: string) => {
  return await BanksDetailModel.findById(id)
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName");
};

const updateBankDetailIntoDB = async (id: string, payload: Partial<IBanksDetail>) => {
  const { currentBalance, transactions, ...safePayload } = payload as any;
  if (safePayload.bankName && safePayload.bankName.trim().toLowerCase() === "cash") {
    safePayload.bankName = "Cash";
    if (safePayload.accountNo === undefined) {
      safePayload.accountNo = "";
    }
  }
  return await BanksDetailModel.findByIdAndUpdate(id, safePayload, {
    new: true,
    runValidators: true,
  });
};

const deleteBankDetailFromDB = async (id: string) => {
  return await BanksDetailModel.findByIdAndDelete(id);
};

// 🟢 Transfer balance between any two accounts (Cash or Bank/bKash etc.)
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

// 🟢 Deposit from Sales Order payment into Cash or Bank account
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

export const BanksDetailServices = {
  createBankDetailIntoDB,
  getAllBankDetailsFromDB,
  getSingleBankDetailFromDB,
  updateBankDetailIntoDB,
  deleteBankDetailFromDB,
  transferBalanceBetweenBanksInDB,
  recordSalesDepositIntoBank,
};