import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    group: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true },
    subGroup: { type: Schema.Types.ObjectId, ref: "ProductSubgroup", required: true },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    weight: { type: Number, default: 0 },
    unit: { type: String, required: true },
  },
  { timestamps: true }
);

export const ProductModel = model("Product", productSchema);