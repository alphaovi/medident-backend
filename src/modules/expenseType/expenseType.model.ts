import { Schema, model } from "mongoose";
import { TExpenseType } from "./expenseType.interface.js";

const expenseTypeSchema = new Schema<TExpenseType>(
  {
    expenseTypeGroup: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseGroup",
      required: true,
    },
    expenseTypeName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const ExpenseTypeModel = model<TExpenseType>(
  "ExpenseType",
  expenseTypeSchema
);