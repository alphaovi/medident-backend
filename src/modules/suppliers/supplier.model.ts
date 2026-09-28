import { Schema, model } from "mongoose";
import { Suppliers } from "./suppliers.interface.js";

const SupplierSchema = new Schema<Suppliers>(
  {
    supplierId: {
      type: String,
      required: [true, "Supplier ID is required"],
      unique: true,
      trim: true,
    },
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      unique: true,
      trim: true,
    },
    supplierPhoneNo: {
      type: String,
      required: [true, "Supplier phone number is required"],
      unique: true,
      trim: true,
    },
    supplierAddress: {
      type: String,
      required: [true, "Supplier address is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SupplierModel = model<Suppliers>(
  "Supplier",
  SupplierSchema
);