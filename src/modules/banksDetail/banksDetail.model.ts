import { Schema, model } from "mongoose";
import { IBanksDetail, IBankTransaction } from "./banksDetail.interface.js";

const bankTransactionSchema = new Schema<IBankTransaction>(
  {
    bankAccount: { type: Schema.Types.ObjectId, ref: "BanksDetail", required: true },
    type: {
      type: String,
      enum: [
        "deposit",
        "transfer_in",
        "transfer_out",
        "expense",
        "asset_purchase",
        "asset_sell",
      ],
      required: true,
    },
    direction: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    fromAccount: { type: Schema.Types.ObjectId, ref: "BanksDetail", default: null },
    toAccount: { type: Schema.Types.ObjectId, ref: "BanksDetail", default: null },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    note: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const banksDetailSchema = new Schema<IBanksDetail>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bankName: { type: String, required: true, trim: true },
    accountNo: {
      type: String,
      default: "",
      trim: true,
      required: function (this: IBanksDetail) {
        return this.bankName?.trim().toLowerCase() !== "cash";
      },
    },
    accountName: { type: String, required: true, trim: true },
    branch: { type: String, default: "", trim: true },
    details: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    currentBalance: { type: Number, default: 0 },
    transactions: { type: [bankTransactionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const BanksDetailModel = model<IBanksDetail>("BanksDetail", banksDetailSchema);