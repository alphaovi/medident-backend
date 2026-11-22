import { Document } from "mongoose";

export type IUserRole = "admin" | "manager" | "staff" | "user";

export type IUser = Document & {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  role: IUserRole;
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