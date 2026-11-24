import mongoose from "mongoose";
import { ExpenseModel } from "./expense.model.js";
import { UserModel } from "../user/user.model.js";
import { BanksDetailModel } from "../banksDetail/banksDetail.model.js";
import { BanksDetailServices } from "../banksDetail/banksDetail.service.js";
import { ExpenseGroupModel } from "../expenseGroup/expenseGroup.model.js";
import { ExpenseTypeModel } from "../expenseType/expenseType.model.js";
import { IJwtPayload } from "../user/user.interface.js";

const createError = (message: string, statusCode = 400) => {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isAdminUser = (requester: IJwtPayload) =>
  requester.role?.toLowerCase() === "admin";

const populateExpenseQuery = (query: any) =>
  query
    .populate("expenseGroup", "expenseGroupName isActive")
    .populate("expenseType", "expenseTypeName isActive")
    .populate("paidBy", "name email role phone")
    .populate("paidFrom", "bankName accountNo accountName currentBalance user");

const createExpenseIntoDB = async (payload: any, requester: IJwtPayload) => {
  const admin = isAdminUser(requester);

  // paidBy user check
  const payerDoc = await UserModel.findById(payload.paidBy).select("_id name email role");
  if (!payerDoc) {
    throw createError("Selected paidBy user not found", 404);
  }

  // Non-admin can only record under their own paidBy ID
  if (!admin && String(payerDoc._id) !== String(requester.userId)) {
    throw createError("Forbidden: You can only record expense for your own account", 403);
  }

  // paidFrom bank account check
  const bankDoc = await BanksDetailModel.findById(payload.paidFrom);
  if (!bankDoc) {
    throw createError("Selected paidFrom bank account not found", 404);
  }

  // Non-admin can only spend from their own bank account
  const bankOwnerId =
    typeof bankDoc.user === "object" && bankDoc.user !== null && "_id" in bankDoc.user
      ? String((bankDoc.user as any)._id)
      : String(bankDoc.user);

  if (!admin && bankOwnerId !== String(requester.userId)) {
    throw createError("Forbidden: You do not own this bank account", 403);
  }

  // Group & Type check (if models exist in project)
  const groupDoc = await ExpenseGroupModel.findById(payload.expenseGroup);
  if (!groupDoc) {
    throw createError("Expense group not found", 404);
  }

  const typeDoc = await ExpenseTypeModel.findById(payload.expenseType);
  if (!typeDoc) {
    throw createError("Expense type not found", 404);
  }

  const amount = Number(payload.amount);
  const expenseDate = payload.date ? new Date(payload.date) : new Date();

  // Deduct amount from paidFrom account's currentBalance & record transaction
  await BanksDetailServices.recordExpenseOutFromBank({
    bankId: bankDoc._id,
    amount,
    date: expenseDate,
    note: payload.notes || `Expense: ${typeDoc.expenseTypeName}`,
  });

  try {
    const created = await ExpenseModel.create({
      date: expenseDate,
      expenseGroup: new mongoose.Types.ObjectId(payload.expenseGroup),
      expenseType: new mongoose.Types.ObjectId(payload.expenseType),
      paidBy: new mongoose.Types.ObjectId(payload.paidBy),
      paidFrom: new mongoose.Types.ObjectId(payload.paidFrom),
      amount,
      notes: payload.notes?.trim() || "",
    });

    return await populateExpenseQuery(ExpenseModel.findById(created._id));
  } catch (err) {
    // Rollback bank balance if expense save fails
    await BanksDetailServices.refundExpenseIntoBank({
      bankId: bankDoc._id,
      amount,
      date: expenseDate,
      note: "Rollback failed expense creation",
    });
    throw err;
  }
};

const getAllExpensesFromDB = async (requester: IJwtPayload) => {
  const admin = isAdminUser(requester);
  const filter = admin ? {} : { paidBy: requester.userId };

  return await populateExpenseQuery(
    ExpenseModel.find(filter).sort({ date: -1, createdAt: -1 })
  );
};

const getSingleExpenseFromDB = async (id: string, requester: IJwtPayload) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid expense ID", 400);
  }

  const expenseDoc = await populateExpenseQuery(ExpenseModel.findById(id));
  if (!expenseDoc) {
    throw createError("Expense not found", 404);
  }

  const admin = isAdminUser(requester);
  const payerId =
    typeof expenseDoc.paidBy === "object" &&
    expenseDoc.paidBy !== null &&
    "_id" in expenseDoc.paidBy
      ? String((expenseDoc.paidBy as any)._id)
      : String(expenseDoc.paidBy);

  if (!admin && payerId !== String(requester.userId)) {
    throw createError("Forbidden: You do not have permission to view this expense", 403);
  }

  return expenseDoc;
};

const updateExpenseIntoDB = async (
  id: string,
  payload: any,
  requester: IJwtPayload
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid expense ID", 400);
  }

  const existing = await ExpenseModel.findById(id);
  if (!existing) {
    throw createError("Expense not found", 404);
  }

  const admin = isAdminUser(requester);
  if (!admin && String(existing.paidBy) !== String(requester.userId)) {
    throw createError("Forbidden: You can only update your own expense", 403);
  }

  const nextPaidBy = payload.paidBy ?? String(existing.paidBy);
  if (!admin && String(nextPaidBy) !== String(requester.userId)) {
    throw createError("Forbidden: You cannot assign expense to another user", 403);
  }

  const nextPaidFrom = payload.paidFrom ?? String(existing.paidFrom);
  const nextAmount = payload.amount !== undefined ? Number(payload.amount) : Number(existing.amount);
  const nextDate = payload.date ? new Date(payload.date) : existing.date;

  const oldBankId = String(existing.paidFrom);
  const newBankId = String(nextPaidFrom);
  const oldAmount = Number(existing.amount);

  // Adjust bank balances cleanly if amount or paidFrom changed
  if (oldBankId === newBankId) {
    const diff = nextAmount - oldAmount;
    if (diff > 0) {
      await BanksDetailServices.recordExpenseOutFromBank({
        bankId: newBankId,
        amount: diff,
        date: nextDate,
        referenceId: existing._id,
        note: `Expense increased (Ref: ${existing._id})`,
      });
    } else if (diff < 0) {
      await BanksDetailServices.refundExpenseIntoBank({
        bankId: newBankId,
        amount: Math.abs(diff),
        date: nextDate,
        referenceId: existing._id,
        note: `Expense decreased (Ref: ${existing._id})`,
      });
    }
  } else {
    // Deduct full new amount from new account first, then refund old amount to old account
    await BanksDetailServices.recordExpenseOutFromBank({
      bankId: newBankId,
      amount: nextAmount,
      date: nextDate,
      referenceId: existing._id,
      note: `Expense moved to account (Ref: ${existing._id})`,
    });
    await BanksDetailServices.refundExpenseIntoBank({
      bankId: oldBankId,
      amount: oldAmount,
      date: nextDate,
      referenceId: existing._id,
      note: `Expense moved out from account (Ref: ${existing._id})`,
    });
  }

  const updatePayload: Record<string, unknown> = {
    date: nextDate,
    expenseGroup: payload.expenseGroup
      ? new mongoose.Types.ObjectId(payload.expenseGroup)
      : existing.expenseGroup,
    expenseType: payload.expenseType
      ? new mongoose.Types.ObjectId(payload.expenseType)
      : existing.expenseType,
    paidBy: new mongoose.Types.ObjectId(nextPaidBy),
    paidFrom: new mongoose.Types.ObjectId(nextPaidFrom),
    amount: nextAmount,
    notes: payload.notes !== undefined ? payload.notes.trim() : existing.notes,
  };

  await ExpenseModel.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });

  return await populateExpenseQuery(ExpenseModel.findById(id));
};

const deleteExpenseFromDB = async (id: string, requester: IJwtPayload) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid expense ID", 400);
  }

  const existing = await ExpenseModel.findById(id);
  if (!existing) {
    throw createError("Expense not found", 404);
  }

  const admin = isAdminUser(requester);
  if (!admin && String(existing.paidBy) !== String(requester.userId)) {
    throw createError("Forbidden: You can only delete your own expense", 403);
  }

  // Refund amount back to paidFrom bank account
  await BanksDetailServices.refundExpenseIntoBank({
    bankId: existing.paidFrom,
    amount: Number(existing.amount),
    referenceId: existing._id,
    note: `Expense deleted (Ref: ${existing._id})`,
  });

  return await ExpenseModel.findByIdAndDelete(id);
};

export const ExpenseServices = {
  createExpenseIntoDB,
  getAllExpensesFromDB,
  getSingleExpenseFromDB,
  updateExpenseIntoDB,
  deleteExpenseFromDB,
};