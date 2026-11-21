import { Schema, model } from "mongoose";
import { IBanksDetail } from "./banksDetail.interface.js";

const banksDetailSchema = new Schema<IBanksDetail>(
  {
    bankName: { type: String, required: true, trim: true },
    accountNo: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    branch: { type: String, default: "", trim: true },
    details: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const BanksDetailModel = model<IBanksDetail>("BanksDetail", banksDetailSchema);