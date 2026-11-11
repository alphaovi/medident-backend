import { Schema, model } from "mongoose";

const inventorySchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    group: { type: Schema.Types.ObjectId, ref: "ProductGroup" },
    subGroup: { type: Schema.Types.ObjectId, ref: "ProductSubGroup" },
    totalStock: { type: Number, default: 0 },
    purchaseReturn: { type: Number, default: 0 },
    sellReturn: { type: Number, default: 0 },
    totalSell: { type: Number, default: 0 },
    damaged: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    freeSample: { type: Number, default: 0 },
    onTransit: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    avgBuyingPrice: { type: Number, default: 0 },
    totalStockValue: { type: Number, default: 0 },
    totalSaleValue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🟢 Pre-Save Hook: dynamically calculate currentStock without resetting totalSell
inventorySchema.pre("save", function () {
  const totalStock = Number(this.totalStock) || 0;
  const totalSell = Number(this.totalSell) || 0;
  const purchaseReturn = Number(this.purchaseReturn) || 0;
  const sellReturn = Number(this.sellReturn) || 0;
  const damaged = Number(this.damaged) || 0;
  const lost = Number(this.lost) || 0;
  const freeSample = Number(this.freeSample) || 0;

  this.currentStock = totalStock - purchaseReturn + sellReturn - totalSell - damaged - lost - freeSample;
});

export const InventoryModel = model("Inventory", inventorySchema);