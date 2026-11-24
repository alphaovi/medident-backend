import { Types } from "mongoose";

export type IExpense = {
  date: Date;
  expenseGroup: Types.ObjectId;
  expenseType: Types.ObjectId;
  paidBy: Types.ObjectId;
  paidFrom: Types.ObjectId;
  amount: number;
  notes?: string;
};