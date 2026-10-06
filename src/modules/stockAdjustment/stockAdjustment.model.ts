import { Schema, model } from "mongoose";
import { StockAdjustment } from "./stockAdjustment.interface.js";

const stockAdjustmentSchema = new Schema<StockAdjustment>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    adjustmentType: { type: String, enum: ["Damaged", "Lost", "Free Sample"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StockAdjustmentModel = model<StockAdjustment>("StockAdjustment", stockAdjustmentSchema);