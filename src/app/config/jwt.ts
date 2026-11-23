import type jwt from "jsonwebtoken";

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }
  return "medident_super_secret_hs256_key_2026";
};

export const getJwtExpiresIn = (): jwt.SignOptions["expiresIn"] => {
  const value = process.env.JWT_EXPIRES_IN?.trim();
  return (value || "7d") as jwt.SignOptions["expiresIn"];
};