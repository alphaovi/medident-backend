import { Response, NextFunction } from "express";
import { UserServices } from "./user.service.js";
import { AuthRequest } from "../../middlewares/auth.middleware.js";

const registerUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await UserServices.registerUserIntoDB(req.body);
    return res.status(201).json({
      success: true,
      message: result.message || "User created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "User creation failed",
    });
  }
};

const verifyAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = (req.query.token || req.body?.token) as string;
    const result = await UserServices.verifyAccountInDB(token);
    return res.status(200).json({
      success: true,
      message: result.message || "Account activated successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Account activation failed",
    });
  }
};

const recoverAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const result = await UserServices.recoverAccountInDB(email);
    return res.status(200).json({
      success: true,
      message: result.message || "Recovery instructions sent",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Account recovery failed",
    });
  }
};

const loginUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await UserServices.loginUserIntoDB(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await UserServices.getMeFromDB(req.user.userId);
    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await UserServices.getAllUsersFromDB();
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const UserControllers = {
  registerUser,
  verifyAccount,
  recoverAccount,
  loginUser,
  getMe,
  getAllUsers,
};