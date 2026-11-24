import { Schema, model } from "mongoose";
import { TExpenseGroup } from "./expenseGroup.interface.js";

const expenseGroupSchema = new Schema<TExpenseGroup>(
  {
    expenseGroupName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ExpenseGroupModel = model<TExpenseGroup>(
  "ExpenseGroup",
  expenseGroupSchema
);