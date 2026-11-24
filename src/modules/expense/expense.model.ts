import { Schema, model } from "mongoose";
import { IExpense } from "./expense.interface.js";

const expenseSchema = new Schema<IExpense>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expenseGroup: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseGroup",
      required: true,
    },
    expenseType: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseType",
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paidFrom: {
      type: Schema.Types.ObjectId,
      ref: "BanksDetail",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than 0"],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "hold", "approve"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const ExpenseModel = model<IExpense>("Expense", expenseSchema);