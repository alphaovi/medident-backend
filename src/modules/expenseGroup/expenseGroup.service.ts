import { ExpenseGroupModel } from "./expenseGroup.model.js";
import {
  TCreateExpenseGroupInput,
  TUpdateExpenseGroupInput,
} from "./expenseGroup.validation.js";

const createExpenseGroup = async (payload: TCreateExpenseGroupInput) => {
  const result = await ExpenseGroupModel.create(payload);
  return result;
};

const getAllExpenseGroups = async (onlyActive = false) => {
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (onlyActive) {
    filter.isActive = true;
  }
  const result = await ExpenseGroupModel.find(filter).sort({ createdAt: -1 });
  return result;
};

const getSingleExpenseGroup = async (id: string) => {
  const result = await ExpenseGroupModel.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });
  return result;
};

const updateExpenseGroup = async (
  id: string,
  payload: TUpdateExpenseGroupInput
) => {
  const result = await ExpenseGroupModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    payload,
    { new: true, runValidators: true }
  );
  return result;
};

const deleteExpenseGroup = async (id: string) => {
  const result = await ExpenseGroupModel.findByIdAndDelete(id);
  return result;
};

export const ExpenseGroupService = {
  createExpenseGroup,
  getAllExpenseGroups,
  getSingleExpenseGroup,
  updateExpenseGroup,
  deleteExpenseGroup,
};