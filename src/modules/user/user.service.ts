import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "./user.model.js";
import { IAssignableRole, IJwtPayload, IUser } from "./user.interface.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const ASSIGNABLE_ROLES: IAssignableRole[] = ["admin", "manager", "user"];

const signToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

const registerUserIntoDB = async (payload: Partial<IUser>) => {
  const normalizedEmail = payload.email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }
  if (!payload.password) {
    throw new Error("Password is required");
  }

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const tempUser = new UserModel();
  const hashedPassword = await tempUser.hashPassword(payload.password);

  const rawActivationToken = crypto.randomBytes(32).toString("hex");
  const hashedActivationToken = crypto
    .createHash("sha256")
    .update(rawActivationToken)
    .digest("hex");

  const fullName =
    payload.name?.trim() ||
    `${payload.firstName || ""} ${payload.lastName || ""}`.trim() ||
    normalizedEmail.split("@")[0];

  // Role pending thakbe; admin role assign korle isActive automatically true hobe
  const createdUser = await UserModel.create({
    name: fullName,
    firstName: payload.firstName?.trim() || "",
    lastName: payload.lastName?.trim() || "",
    email: normalizedEmail,
    phone: payload.phone?.trim() || "",
    password: hashedPassword,
    role: "pending",
    status: "pending",
    isActive: false,
    activationToken: hashedActivationToken,
    activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const activationLink = `${FRONTEND_URL}/verify-account?token=${rawActivationToken}`;
  console.log("📧 [ACCOUNT ACTIVATION LINK]:", activationLink);

  return {
    requiresApproval: true,
    message:
      "Account created! Your account is pending admin approval. Activation link sent to your email.",
    user: {
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      status: createdUser.status,
      isActive: createdUser.isActive,
    },
  };
};

// Role pending theke set hoye gele isActive automatically true hoye jabe
const approveUserAndAssignRoleInDB = async (userId: string, role: IAssignableRole) => {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new Error("Invalid role. Allowed roles: admin, manager, user");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const wasPending = user.role === "pending";
  user.role = role;
  user.status = "approved";

  // Role pending theke assign hole (ba approved hole) isActive automatically true
  if (wasPending || !user.isActive) {
    user.isActive = true;
  }

  const updatedUser = await user.save();
  const safeUser = await UserModel.findById(updatedUser._id).select("-password");
  return safeUser;
};

// Admin chaile pore isActive true ba false kore dite parbe
const updateUserActiveStatusInDB = async (userId: string, isActive: boolean) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (isActive && user.role === "pending") {
    throw new Error("Assign a role (admin, manager, or user) before activating this pending user");
  }

  user.isActive = Boolean(isActive);
  await user.save();

  return await UserModel.findById(user._id).select("-password");
};

const verifyAccountInDB = async (rawToken: string) => {
  if (!rawToken) {
    throw new Error("Activation token is required");
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await UserModel.findOne({
    activationToken: hashedToken,
    activationExpires: { $gt: new Date() },
  }).select("+activationToken +activationExpires");

  if (!user) {
    throw new Error("Activation link is invalid or expired");
  }

  user.activationToken = null;
  user.activationExpires = null;

  // Role already set thakle isActive true hobe; pending thakle role assign howar por true hobe
  if (user.role !== "pending" && user.status === "approved") {
    user.isActive = true;
  }

  await user.save();

  return {
    message:
      user.role !== "pending" && user.isActive
        ? "Email verified and account active! You can sign in."
        : "Email verified! Waiting for admin to assign a role and activate your account.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    },
  };
};

const recoverAccountInDB = async (email: string) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const user = await UserModel.findOne({ email: normalizedEmail }).select(
    "+resetPasswordToken +resetPasswordExpires"
  );

  if (user) {
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(rawResetToken)
      .digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const recoveryLink = `${FRONTEND_URL}/reset-password?token=${rawResetToken}`;
    console.log("🔑 [PASSWORD RECOVERY LINK]:", recoveryLink);
  }

  return {
    message: "If an account exists with this e-mail, recovery instructions have been sent.",
  };
};

const loginUserIntoDB = async (payload: { email: string; password: string }) => {
  const normalizedEmail = payload.email?.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.role === "pending" || user.status !== "approved") {
    throw new Error("Your account is pending admin approval. Please wait for role assignment.");
  }

  if (!user.isActive) {
    throw new Error("Your account is currently deactivated. Please contact admin.");
  }

  const isMatch = await bcrypt.compare(payload.password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const jwtPayload: IJwtPayload = {
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = signToken(jwtPayload);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    },
  };
};

const getMeFromDB = async (userId: string) => {
  return await UserModel.findById(userId).select("-password");
};

const getAllUsersFromDB = async () => {
  return await UserModel.find().select("-password").sort({ createdAt: -1 });
};

export const UserServices = {
  registerUserIntoDB,
  approveUserAndAssignRoleInDB,
  updateUserActiveStatusInDB,
  verifyAccountInDB,
  recoverAccountInDB,
  loginUserIntoDB,
  getMeFromDB,
  getAllUsersFromDB,
};