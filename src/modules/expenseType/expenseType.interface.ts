import { Types } from "mongoose";

export type TExpenseType = {
  expenseTypeGroup: Types.ObjectId;
  expenseTypeName: string;
  isActive: boolean;
};