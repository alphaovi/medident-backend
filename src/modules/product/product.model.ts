import { Schema, model } from "mongoose";
import { ProductDetails } from "./product.interface.js";

const ProductSchema = new Schema<ProductDetails>(
  {
    id: {
      type: String,
      required: [true, "Product id is required"],
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      unique: true,
      trim: true,
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: "ProductGroup",
      required: [true, "Product group is required"],
    },

    subGroup: {
      type: Schema.Types.ObjectId,
      ref: "ProductSubgroup",
      required: [true, "Product subgroup is required"],
    },

    unit: {
      type: Number,
      required: [true, "Unit is required"],
      min: [0, "Unit cannot be negative"],
    },

    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0, "Weight cannot be negative"],
    },

    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
    },

    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },

    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = model<ProductDetails>(
  "Product",
  ProductSchema
);