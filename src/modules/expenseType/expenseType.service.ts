import { Types } from "mongoose";
import { ExpenseGroupModel } from "../expenseGroup/expenseGroup.model.js";
import { ExpenseTypeModel } from "./expenseType.model.js";
import {
  TCreateExpenseTypeInput,
  TUpdateExpenseTypeInput,
} from "./expenseType.validation.js";

const createExpenseType = async (payload: TCreateExpenseTypeInput) => {
  const groupExists = await ExpenseGroupModel.findOne({
    _id: payload.expenseTypeGroup,
    isDeleted: { $ne: true },
  });
  if (!groupExists) {
    throw new Error("Expense group not found");
  }

  const result = await ExpenseTypeModel.create({
    ...payload,
    expenseTypeGroup: new Types.ObjectId(payload.expenseTypeGroup),
  });

  return result.populate("expenseTypeGroup", "expenseGroupName isActive");
};

const getAllExpenseTypes = async (onlyActive = false) => {
  const filter: Record<string, unknown> = {};
  if (onlyActive) {
    filter.isActive = true;
  }

  const result = await ExpenseTypeModel.find(filter)
    .populate("expenseTypeGroup", "expenseGroupName isActive")
    .sort({ createdAt: -1 });

  return result;
};

const getSingleExpenseType = async (id: string) => {
  const result = await ExpenseTypeModel.findById(id).populate(
    "expenseTypeGroup",
    "expenseGroupName isActive"
  );
  return result;
};

const updateExpenseType = async (
  id: string,
  payload: TUpdateExpenseTypeInput
) => {
  if (payload.expenseTypeGroup) {
    const groupExists = await ExpenseGroupModel.findOne({
      _id: payload.expenseTypeGroup,
      isDeleted: { $ne: true },
    });
    if (!groupExists) {
      throw new Error("Target expense group not found");
    }
  }

  const updateDoc: Record<string, unknown> = { ...payload };
  if (payload.expenseTypeGroup) {
    updateDoc.expenseTypeGroup = new Types.ObjectId(payload.expenseTypeGroup);
  }

  const updated = await ExpenseTypeModel.findByIdAndUpdate(id, updateDoc, {
    new: true,
    runValidators: true,
  }).populate("expenseTypeGroup", "expenseGroupName isActive");

  return updated;
};

const deleteExpenseType = async (id: string) => {
  const deleted = await ExpenseTypeModel.findByIdAndDelete(id);
  return deleted;
};

export const ExpenseTypeService = {
  createExpenseType,
  getAllExpenseTypes,
  getSingleExpenseType,
  updateExpenseType,
  deleteExpenseType,
};