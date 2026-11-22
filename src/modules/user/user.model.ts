import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "./user.interface.js";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["pending", "admin", "manager", "user"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isActive: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    activationToken: { type: String, default: null, select: false },
    activationExpires: { type: Date, default: null, select: false },
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export const UserModel = model<IUser>("User", userSchema);