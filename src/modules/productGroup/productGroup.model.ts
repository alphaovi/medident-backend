import { Schema, model } from "mongoose";
import { ProductGroup } from "./productGroup.interface.js";

const ProductGroupSchema = new Schema<ProductGroup>(
  {
    id: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "Product group id is required"],
    },

    groupName: {
      type: String,
      required: [true, "Group name is required"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductGroupModel = model<ProductGroup>(
  "ProductGroup",
  ProductGroupSchema
);