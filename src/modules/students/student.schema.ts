import { Schema, model } from "mongoose";
import {
  Guardian,
  LocalGuardian,
  Student,
  UserName,
} from "./student.interface.js";

const UserNameSchema = new Schema<UserName>({
  firstName: { type: String, required: [true, "First Name Must be Required."] },
  middleName: { type: String },
  lastName: { type: String, required: [true, "Last Name Also Required"] },
});

const GuardianSchema = new Schema<Guardian>({
  fatherName: { type: String, required: [true, "Father name is required"] },
  fatherOccupation: {
    type: String,
    required: [true, "Father Occupation is required"],
  },
  fatherContactNo: { type: String, required: true },
  motherName: { type: String, required: true },
  motherOccupation: { type: String, required: true },
  motherContactNo: { type: String, required: true },
});

const LocalGuardianSchema = new Schema<LocalGuardian>({
  name: { type: String, required: true },
  occupation: { type: String, required: true },
  contactNo: { type: String, required: true },
  address: { type: String, required: true },
});

const StudentSchema = new Schema<Student>({
  id: { type: String, required: true, unique: true },
  name: {
    type: UserNameSchema,
    required: true,
  },
  gender: {
    type: String,
    enum: {
      values: ["male", "female"],
      message: "{VALUE} is not valid. Gender must be 'Male' ir 'Female' .",
    },
  },
  dateOfBirth: { type: String },
  email: { type: String, required: true, unique: true, },
  contactNo: { type: String, required: true, unique: true },
  emergencyContactNo: { type: String, required: true, unique: true },
  bloodGroup: {
    type: String,
    enum: {
      values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      message: "{VALUE} is not valid. You must select between A+, A-, B+, B-, AB+, AB-, O+, O-",
    },
  },
  presentAddress: { type: String, required: true },
  permanentAddress: { type: String, required: true },
  guardian: {
    type: GuardianSchema,
    required: true,
  },
  localGuardian: {
    type: LocalGuardianSchema,
    required: true,
  },
  profileImg: { type: String },
  isActive: {
    type: String,
    enum: ["active", "blocked"],
    default: "active",
  },
});

// creating model
export const StudentModel = model<Student>("Student", StudentSchema);
