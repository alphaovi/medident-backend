import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IJwtPayload } from "../modules/user/user.interface.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_prod";

export interface AuthRequest extends Request {
  user?: IJwtPayload;
}

export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : (req as any).cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token not found",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};