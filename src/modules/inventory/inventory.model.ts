import { Schema, model } from "mongoose";
import { Inventory } from "./inventory.interface.js";

const inventorySchema = new Schema<Inventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      unique: true,
    },

    totalStock: {
      type: Number,
      required: [true, "Total stock is required"],
      min: [0, "Total stock cannot be negative"],
    },

    totalSell: {
      type: Number,
      required: [true, "Total sell is required"],
      min: [0, "Total sell cannot be negative"],
    },

    currentStock: {
      type: Number,
      required: [true, "Current stock is required"],
      min: [0, "Current stock cannot be negative"],
    },

    avgBuyingPrice: {
      type: Number,
      required: [true, "Average buying price is required"],
      min: [0, "Average buying price cannot be negative"],
    },

    totalStockValue: {
      type: Number,
      required: [true, "Total stock value is required"],
      min: [0, "Total stock value cannot be negative"],
    },

    totalSaleValue: {
      type: Number,
      required: [true, "Total sale value is required"],
      min: [0, "Total sale value cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

export const InventoryModel = model<Inventory>(
  "Inventory",
  inventorySchema
);