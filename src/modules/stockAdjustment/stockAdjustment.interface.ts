import { Types } from "mongoose";

export type AdjustmentType = "Damaged" | "Lost" | "Free Sample";

export type StockAdjustment = {
  product: Types.ObjectId;
  customer?: Types.ObjectId; 
  adjustmentType: AdjustmentType;
  quantity: number;
  referredBy?: string; 
  note?: string;
  updatedBy: string;
  date: Date;
};