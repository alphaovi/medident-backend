import { Schema, model } from "mongoose";
import { Employee } from "./employee.interface.js";

const AssignCustomerSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },

    customerId: {
      type: String,
      required: [true, "Customer id is required"],
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const EmployeeSchema = new Schema<Employee>(
  {
    id: {
      type: String,
      required: [true, "Employee id is required"],
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },

    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },

    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
    },

    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: true,
    },

    assignCustomers: {
      type: [AssignCustomerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeModel = model<Employee>("Employee", EmployeeSchema);
