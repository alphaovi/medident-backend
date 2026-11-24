import mongoose from "mongoose";
import { ExpenseModel } from "./expense.model.js";
import { UserModel } from "../user/user.model.js";
import { BanksDetailModel } from "../banksDetail/banksDetail.model.js";
import { BanksDetailServices } from "../banksDetail/banksDetail.service.js";
import { ExpenseGroupModel } from "../expenseGroup/expenseGroup.model.js";
import { ExpenseTypeModel } from "../expenseType/expenseType.model.js";
import { IJwtPayload } from "../user/user.interface.js";
import { TExpenseStatus } from "./expense.interface.js";

const createError = (message: string, statusCode = 400) => {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isAdminUser = (requester: IJwtPayload) => {
  const role = requester.role?.toLowerCase();
  return role === "admin" || role === "superadmin" || role === "super_admin";
};

const populateExpenseQuery = (query: any) =>
  query
    .populate("expenseGroup", "expenseGroupName isActive")
    .populate("expenseType", "expenseTypeName isActive")
    .populate("paidBy", "name email role phone")
    .populate("paidFrom", "bankName accountNo accountName currentBalance user")
    .populate("approvedBy", "name email role");

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

  // Group & Type check
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

  // শুধুমাত্র Admin চাইলে সরাসরি approve বা hold দিতে পারবেন, অন্যথায় ডিফল্ট pending হবে
  const initialStatus: TExpenseStatus =
    admin && payload.status ? payload.status : "pending";

  // যদি সরাসরি approve অবস্থায় তৈরি হয় তবেই ব্যাংক থেকে টাকা কাটবে
  if (initialStatus === "approve") {
    await BanksDetailServices.recordExpenseOutFromBank({
      bankId: bankDoc._id,
      amount,
      date: expenseDate,
      note: payload.notes || `Expense Approved: ${typeDoc.expenseTypeName}`,
    });
  }

  try {
    const created = await ExpenseModel.create({
      date: expenseDate,
      expenseGroup: new mongoose.Types.ObjectId(payload.expenseGroup),
      expenseType: new mongoose.Types.ObjectId(payload.expenseType),
      paidBy: new mongoose.Types.ObjectId(payload.paidBy),
      paidFrom: new mongoose.Types.ObjectId(payload.paidFrom),
      amount,
      notes: payload.notes?.trim() || "",
      status: initialStatus,
      approvedBy:
        initialStatus === "approve"
          ? new mongoose.Types.ObjectId(requester.userId)
          : null,
      approvedAt: initialStatus === "approve" ? new Date() : null,
    });

    return await populateExpenseQuery(ExpenseModel.findById(created._id));
  } catch (err) {
    // Rollback bank balance if expense save fails after deduction
    if (initialStatus === "approve") {
      await BanksDetailServices.refundExpenseIntoBank({
        bankId: bankDoc._id,
        amount,
        date: expenseDate,
        note: "Rollback failed expense creation",
      });
    }
    throw err;
  }
};

// Expense List: এখানে pending, hold, approve সব স্ট্যাটাসই দেখা যাবে
const getAllExpensesFromDB = async (
  requester: IJwtPayload,
  queryParams: Record<string, any> = {}
) => {
  const admin = isAdminUser(requester);
  const filter: Record<string, any> = admin ? {} : { paidBy: requester.userId };

  // যদি ফ্রন্টএন্ড থেকে কোনো নির্দিষ্ট স্ট্যাটাস ফিল্টার পাঠানো হয় (যেমন ?status=pending)
  if (
    queryParams.status &&
    ["pending", "hold", "approve"].includes(String(queryParams.status))
  ) {
    filter.status = String(queryParams.status);
  }

  return await populateExpenseQuery(
    ExpenseModel.find(filter).sort({ date: -1, createdAt: -1 })
  );
};

// Reports: এখানে শুধুমাত্র 'approve' হওয়া এক্সপেন্সগুলোই দেখাবে
const getApprovedExpenseReportsFromDB = async (
  requester: IJwtPayload,
  queryParams: Record<string, any> = {}
) => {
  const admin = isAdminUser(requester);
  const filter: Record<string, any> = {
    status: "approve",
    ...(admin ? {} : { paidBy: requester.userId }),
  };

  if (queryParams.startDate || queryParams.endDate) {
    filter.date = {};
    if (queryParams.startDate) {
      filter.date.$gte = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      const end = new Date(queryParams.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (queryParams.expenseGroup && mongoose.isValidObjectId(queryParams.expenseGroup)) {
    filter.expenseGroup = queryParams.expenseGroup;
  }

  if (queryParams.paidBy && admin && mongoose.isValidObjectId(queryParams.paidBy)) {
    filter.paidBy = queryParams.paidBy;
  }

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

// Admin Status Update (Pending / Hold / Approve)
const updateExpenseStatusIntoDB = async (
  id: string,
  newStatus: TExpenseStatus,
  requester: IJwtPayload
) => {
  if (!isAdminUser(requester)) {
    throw createError("Forbidden: Only admin can change expense status", 403);
  }

  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid expense ID", 400);
  }

  const existing = await ExpenseModel.findById(id);
  if (!existing) {
    throw createError("Expense not found", 404);
  }

  const oldStatus = existing.status || "pending";
  if (oldStatus === newStatus) {
    return await populateExpenseQuery(ExpenseModel.findById(id));
  }

  const amount = Number(existing.amount);

  // ১. আগে approve ছিল না, এখন approve করা হচ্ছে -> ব্যাংক থেকে টাকা কাটবে
  if (oldStatus !== "approve" && newStatus === "approve") {
    await BanksDetailServices.recordExpenseOutFromBank({
      bankId: existing.paidFrom,
      amount,
      date: existing.date,
      referenceId: existing._id,
      note: `Expense approved (Ref: ${existing._id})`,
    });
  }

  // ২. আগে approve ছিল, এখন hold বা pending করা হচ্ছে -> ব্যাংকে টাকা রিফান্ড হবে
  if (oldStatus === "approve" && newStatus !== "approve") {
    await BanksDetailServices.refundExpenseIntoBank({
      bankId: existing.paidFrom,
      amount,
      date: new Date(),
      referenceId: existing._id,
      note: `Expense status changed to ${newStatus} (Ref: ${existing._id})`,
    });
  }

  const statusUpdate: Record<string, any> = {
    status: newStatus,
    approvedBy:
      newStatus === "approve"
        ? new mongoose.Types.ObjectId(requester.userId)
        : null,
    approvedAt: newStatus === "approve" ? new Date() : null,
  };

  await ExpenseModel.findByIdAndUpdate(id, statusUpdate, {
    new: true,
    runValidators: true,
  });

  return await populateExpenseQuery(ExpenseModel.findById(id));
};

// Edit Expense (টাকা কমা-বাড়া, ব্যাংক বদলানো এবং স্ট্যাটাস হ্যান্ডলিংসহ)
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

  const oldStatus: TExpenseStatus = existing.status || "pending";

  // সাধারণ ইউজার একবার approve হওয়া এক্সপেন্স এডিট করতে পারবেন না
  if (!admin && oldStatus === "approve") {
    throw createError("Approved expense cannot be edited by non-admin user", 403);
  }

  // সাধারণ ইউজার স্ট্যাটাস পরিবর্তন করতে পারবেন না
  if (!admin && payload.status && payload.status !== oldStatus) {
    throw createError("Forbidden: Only admin can change expense status", 403);
  }

  const nextStatus: TExpenseStatus =
    admin && payload.status ? payload.status : oldStatus;

  const nextPaidBy = payload.paidBy ?? String(existing.paidBy);
  if (!admin && String(nextPaidBy) !== String(requester.userId)) {
    throw createError("Forbidden: You cannot assign expense to another user", 403);
  }

  const nextPaidFrom = payload.paidFrom ?? String(existing.paidFrom);
  const nextAmount =
    payload.amount !== undefined ? Number(payload.amount) : Number(existing.amount);
  const nextDate = payload.date ? new Date(payload.date) : existing.date;

  const oldBankId = String(existing.paidFrom);
  const newBankId = String(nextPaidFrom);
  const oldAmount = Number(existing.amount);

  // ব্যাংক ব্যালেন্স অ্যাডজাস্টমেন্ট লজিক (স্ট্যাটাস অনুযায়ী)
  if (oldStatus !== "approve" && nextStatus === "approve") {
    // আগে পেন্ডিং/হোল্ড ছিল, এডিটের সাথে সাথে অ্যাপ্রুভ করা হলো -> নতুন অ্যাকাউন্ট থেকে পুরো টাকা কাটবে
    await BanksDetailServices.recordExpenseOutFromBank({
      bankId: newBankId,
      amount: nextAmount,
      date: nextDate,
      referenceId: existing._id,
      note: `Expense approved on edit (Ref: ${existing._id})`,
    });
  } else if (oldStatus === "approve" && nextStatus !== "approve") {
    // আগে অ্যাপ্রুভ ছিল, এখন হোল্ড/পেন্ডিং করা হলো -> পুরোনো অ্যাকাউন্টে পুরো টাকা রিফান্ড হবে
    await BanksDetailServices.refundExpenseIntoBank({
      bankId: oldBankId,
      amount: oldAmount,
      date: nextDate,
      referenceId: existing._id,
      note: `Expense reverted to ${nextStatus} on edit (Ref: ${existing._id})`,
    });
  } else if (oldStatus === "approve" && nextStatus === "approve") {
    // আগেও অ্যাপ্রুভ ছিল, এখনো অ্যাপ্রুভ আছে -> টাকা কমা-বাড়া বা ব্যাংক পরিবর্তনের হিসাব হবে
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
  }
  // নোট: oldStatus এবং nextStatus দুটোই pending বা hold থাকলে ব্যাংক ব্যালেন্সে কোনো হাত দেওয়া হবে না।

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
    status: nextStatus,
  };

  if (oldStatus !== "approve" && nextStatus === "approve") {
    updatePayload.approvedBy = new mongoose.Types.ObjectId(requester.userId);
    updatePayload.approvedAt = new Date();
  } else if (nextStatus !== "approve") {
    updatePayload.approvedBy = null;
    updatePayload.approvedAt = null;
  }

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

  if (!admin && existing.status === "approve") {
    throw createError("Approved expense cannot be deleted by non-admin user", 403);
  }

  // শুধুমাত্র যদি এক্সপেন্সটি approve হয়ে থাকে, তবেই ডিলিট করার সময় ব্যাংকে টাকা রিফান্ড হবে
  if (existing.status === "approve") {
    await BanksDetailServices.refundExpenseIntoBank({
      bankId: existing.paidFrom,
      amount: Number(existing.amount),
      referenceId: existing._id,
      note: `Approved expense deleted (Ref: ${existing._id})`,
    });
  }

  return await ExpenseModel.findByIdAndDelete(id);
};

export const ExpenseServices = {
  createExpenseIntoDB,
  getAllExpensesFromDB,
  getApprovedExpenseReportsFromDB,
  getSingleExpenseFromDB,
  updateExpenseStatusIntoDB,
  updateExpenseIntoDB,
  deleteExpenseFromDB,
};