import { Schema, model } from "mongoose";
import { BangladeshDivision, Customer } from "./customers.interface.js";

const divisions: BangladeshDivision[] = [
  "Barisal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
];

const CustomerSchema = new Schema<Customer>(
  {
    id: {
      type: String,
      required: [true, "Customer id is required"],
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    division: {
      type: String,
      required: [true, "Division is required"],
      enum: {
        values: divisions,
        message: "Invalid Bangladesh division",
      },
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },

    sr: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "SR is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CustomerModel = model<Customer>("Customer", CustomerSchema);
