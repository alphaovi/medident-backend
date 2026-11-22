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
      enum: ["admin", "manager", "staff", "user"],
      default: "user",
    },
    isActive: { type: Boolean, default: false },
    activationToken: { type: String, default: null, select: false },
    activationExpires: { type: Date, default: null, select: false },
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.hashPassword = async function (plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await this.hashPassword(this.password);
  next();
});

export const UserModel = model<IUser>("User", userSchema);