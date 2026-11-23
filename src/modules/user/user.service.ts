import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "./user.model.js";
import { IAssignableRole, IJwtPayload, IUser } from "./user.interface.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { getJwtExpiresIn, getJwtSecret } from "../../app/config/jwt.js";

const ASSIGNABLE_ROLES: IAssignableRole[] = ["admin", "manager", "user"];

const ALLOWED_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://medidentbd.netlify.app",
  "http://medidentbd.netlify.app",
  "https://www.medidentbd.netlify.app",
  "https://medidentbd.com",
  "http://medidentbd.com",
  "https://www.medidentbd.com",
  "http://www.medidentbd.com",
];

const cleanSingleUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  // Handle accidental "url1 || url2" or comma/space separated values in env
  const firstPart = raw.split(/\|\||,|\s+/)[0]?.trim();
  if (!firstPart) return null;

  try {
    const parsed = new URL(firstPart);
    return parsed.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
};

const resolveFrontendOrigin = (clientOrigin?: string): string => {
  const cleanedClientOrigin = cleanSingleUrl(clientOrigin);
  const envOrigin = cleanSingleUrl(process.env.FRONTEND_URL);

  const allowedSet = new Set<string>(ALLOWED_FRONTEND_ORIGINS);
  if (envOrigin) {
    allowedSet.add(envOrigin);
  }

  if (cleanedClientOrigin && allowedSet.has(cleanedClientOrigin)) {
    return cleanedClientOrigin;
  }

  return envOrigin || "https://medidentbd.netlify.app";
};

const signToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: getJwtExpiresIn(),
  });
};

// 1. Create Account -> DB Save + Send Verification Email
const registerUserIntoDB = async (
  payload: Partial<IUser> & { clientOrigin?: string }
) => {
  const normalizedEmail = payload.email?.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");
  if (!payload.password) throw new Error("Password is required");

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("User with this email already exists");
  }

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
    password: payload.password,
    role: "pending",
    status: "pending",
    isActive: false,
    isEmailVerified: false,
    activationToken: hashedActivationToken,
    activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const targetOrigin = resolveFrontendOrigin(payload.clientOrigin);
  const activationLink = `${targetOrigin}/verify-account?token=${rawActivationToken}`;

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify Your Email & Activate Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px;">
        <h2 style="color: #0b7ad8; margin-bottom: 12px;">Welcome, ${fullName}!</h2>
        <p style="color: #334155; font-size: 14px;">Please verify your email address by clicking the button below:</p>
        <p style="margin: 22px 0;">
          <a href="${activationLink}" style="background: #0b7ad8; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p style="color: #64748b; font-size: 12px;">Or copy this link:<br/>${activationLink}</p>
        <p style="color: #64748b; font-size: 12px;">Note: Your account remains pending until an admin assigns your role.</p>
      </div>
    `,
  });

  return {
    requiresApproval: true,
    message:
      "Account created! Verification email sent to your inbox. Please verify your email and wait for admin role approval.",
    user: {
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      status: createdUser.status,
      isActive: createdUser.isActive,
      isEmailVerified: createdUser.isEmailVerified,
    },
  };
};

// 2. Verify Email Link
const verifyAccountInDB = async (rawToken: string) => {
  if (!rawToken) throw new Error("Activation token is required");

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await UserModel.findOne({
    activationToken: hashedToken,
    activationExpires: { $gt: new Date() },
  }).select("+activationToken +activationExpires");

  if (!user) {
    throw new Error("Verification link is invalid or expired");
  }

  user.isEmailVerified = true;
  user.activationToken = null;
  user.activationExpires = null;

  if (user.role !== "pending" && user.status === "approved") {
    user.isActive = true;
  }

  await user.save();

  return {
    message:
      user.role !== "pending" && user.isActive
        ? "Email verified and account active! You can sign in now."
        : "Email verified successfully! Please wait for admin to assign your role.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    },
  };
};

// 3. Admin Approves & Assigns Role -> Auto isActive = true
const approveUserAndAssignRoleInDB = async (userId: string, role: IAssignableRole) => {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new Error("Invalid role. Allowed roles: admin, manager, user");
  }

  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const wasPending = user.role === "pending";
  user.role = role;
  user.status = "approved";

  if (wasPending || !user.isActive) {
    user.isActive = true;
  }

  await user.save();
  return await UserModel.findById(user._id).select("-password");
};

// 4. Admin Toggle isActive Later (true / false)
const updateUserActiveStatusInDB = async (userId: string, isActive: boolean) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  if (isActive && user.role === "pending") {
    throw new Error("Assign a role (admin, manager, or user) before activating a pending user");
  }

  user.isActive = Boolean(isActive);
  await user.save();
  return await UserModel.findById(user._id).select("-password");
};

// 5. Account Recovery Email
const recoverAccountInDB = async (email: string) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");

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

    const recoveryLink = `${resolveFrontendOrigin()}/reset-password?token=${rawResetToken}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>Password Reset Request</h3>
          <p>Click the link below to reset your password (valid for 30 minutes):</p>
          <p><a href="${recoveryLink}">${recoveryLink}</a></p>
        </div>
      `,
    });
  }

  return {
    message: "If an account exists with this e-mail, recovery instructions have been sent.",
  };
};

// 6. Login (HS256 Token)
const loginUserIntoDB = async (payload: { email: string; password: string }) => {
  const normalizedEmail = payload.email?.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new Error("Please verify your email address from your inbox before signing in.");
  }

  if (user.role === "pending" || user.status !== "approved") {
    throw new Error("Your account is pending admin approval. Please wait for role assignment.");
  }

  if (!user.isActive) {
    throw new Error("Your account is deactivated. Please contact admin.");
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
      isEmailVerified: user.isEmailVerified,
    },
  };
};

const getMeFromDB = async (userId: string) => {
  return await UserModel.findById(userId).select("-password");
};

const getAllUsersFromDB = async () => {
  return await UserModel.find().select("-password").sort({ createdAt: -1 });
};

const updateUserProfileInDB = async (
  targetUserId: string,
  payload: Partial<IUser>,
  requester: IJwtPayload
) => {
  const isSelf = String(requester.userId) === String(targetUserId);
  const isAdmin = requester.role === "admin";

  if (!isSelf && !isAdmin) {
    throw new Error("Forbidden: You can only update your own profile");
  }

  const user = await UserModel.findById(targetUserId);
  if (!user) {
    throw new Error("User not found");
  }

  if (payload.firstName !== undefined) user.firstName = payload.firstName.trim();
  if (payload.lastName !== undefined) user.lastName = payload.lastName.trim();
  if (payload.phone !== undefined) user.phone = payload.phone.trim();

  if (payload.name !== undefined && payload.name.trim()) {
    user.name = payload.name.trim();
  } else if (payload.firstName !== undefined || payload.lastName !== undefined) {
    const combined = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (combined) user.name = combined;
  }

  await user.save();
  return await UserModel.findById(user._id).select("-password");
};

export const UserServices = {
  registerUserIntoDB,
  verifyAccountInDB,
  approveUserAndAssignRoleInDB,
  updateUserActiveStatusInDB,
  recoverAccountInDB,
  loginUserIntoDB,
  getMeFromDB,
  getAllUsersFromDB,
  updateUserProfileInDB,
};