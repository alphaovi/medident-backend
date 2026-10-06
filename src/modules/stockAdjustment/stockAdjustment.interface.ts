import { Types } from "mongoose";

export type AdjustmentType = "Damaged" | "Lost" | "Free Sample";

export type StockAdjustment = {
  product: Types.ObjectId;
  adjustmentType: AdjustmentType;
  quantity: number;
  note?: string;
  date: Date;
};