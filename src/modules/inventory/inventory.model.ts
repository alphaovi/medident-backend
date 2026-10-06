import { Schema, model } from "mongoose";

const inventorySchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    group: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true },
    subGroup: { type: Schema.Types.ObjectId, ref: "ProductSubgroup", required: true },
    totalStock: { type: Number, default: 0 },
    totalSell: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    onTransit: { type: Number, default: 0 },
    damaged: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    freeSample: { type: Number, default: 0 },
    avgBuyingPrice: { type: Number, default: 0 },
    totalStockValue: { type: Number, default: 0 },
    totalSaleValue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const InventoryModel = model("Inventory", inventorySchema);