import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "./user.model.js";
import { IJwtPayload, IUser } from "./user.interface.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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

  const createdUser = await UserModel.create({
    name: fullName,
    firstName: payload.firstName?.trim() || "",
    lastName: payload.lastName?.trim() || "",
    email: normalizedEmail,
    phone: payload.phone?.trim() || "",
    password: hashedPassword,
    role: payload.role || "user",
    isActive: false,
    activationToken: hashedActivationToken,
    activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  const activationLink = `${FRONTEND_URL}/verify-account?token=${rawActivationToken}`;

  // TODO: Ekhane apnar nodemailer / Resend / SendGrid mail sender call kore `activationLink` mail-e pathaben
  console.log("📧 [ACCOUNT ACTIVATION LINK]:", activationLink);

  return {
    requiresActivation: true,
    message:
      "Account created! Activation link sent to your email. Click the link in your email to activate your account.",
    user: {
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      isActive: createdUser.isActive,
    },
  };
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

  user.isActive = true;
  user.activationToken = null;
  user.activationExpires = null;
  await user.save();

  return {
    message: "Account activated successfully! You can now sign in.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
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
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const recoveryLink = `${FRONTEND_URL}/reset-password?token=${rawResetToken}`;
    // TODO: Ekhane mail sender diye `recoveryLink` pathaben
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

  if (!user.isActive) {
    throw new Error("Your account is not active yet. Please click the activation link sent to your email.");
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
    },
  };
};

const getMeFromDB = async (userId: string) => {
  return await UserModel.findById(userId).select("-password");
};

const getAllUsersFromDB = async () => {
  return await UserModel.find().select("-password").sort({ name: 1 });
};

export const UserServices = {
  registerUserIntoDB,
  verifyAccountInDB,
  recoverAccountInDB,
  loginUserIntoDB,
  getMeFromDB,
  getAllUsersFromDB,
};