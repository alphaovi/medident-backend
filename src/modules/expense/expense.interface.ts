import { Types } from "mongoose";

export type TExpenseStatus = "pending" | "hold" | "approve";

export type IExpense = {
  date: Date;
  expenseGroup: Types.ObjectId;
  expenseType: Types.ObjectId;
  paidBy: Types.ObjectId;
  paidFrom: Types.ObjectId;
  amount: number;
  notes?: string;
  status: TExpenseStatus;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
};