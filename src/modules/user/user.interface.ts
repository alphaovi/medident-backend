import { Document } from "mongoose";

export type IUserRole = "pending" | "admin" | "manager" | "user";
export type IAssignableRole = Exclude<IUserRole, "pending">;
export type IUserStatus = "pending" | "approved" | "rejected";

export type IUser = Document & {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  role: IUserRole;
  status: IUserStatus;
  isActive: boolean;
  activationToken?: string | null;
  activationExpires?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  hashPassword(plainPassword: string): Promise<string>;
};

export type IJwtPayload = {
  userId: string;
  name: string;
  email: string;
  role: IUserRole;
};