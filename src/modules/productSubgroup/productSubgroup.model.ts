import { Schema, model } from "mongoose";
import { ProductSubgroup } from "./productSubgroup.interface.js";

const ProductSubgroupSchema = new Schema<ProductSubgroup>(
  {
    id: {
      type: String,
      required: [true, "Product subgroup id is required"],
      unique: true,
      trim: true,
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: "ProductGroup",
      required: [true, "Product group reference is required"],
    },

    subGroupName: {
      type: String,
      required: [true, "Subgroup name is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductSubgroupModel = model<ProductSubgroup>(
  "ProductSubgroup",
  ProductSubgroupSchema
);