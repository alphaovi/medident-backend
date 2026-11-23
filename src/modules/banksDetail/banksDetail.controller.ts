import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware.js";
import { BanksDetailServices } from "./banksDetail.service.js";

const createBankDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await BanksDetailServices.createBankDetailIntoDB(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Bank detail created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBankDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await BanksDetailServices.getAllBankDetailsFromDB(req.user);
    return res.status(200).json({
      success: true,
      message: "Bank details fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleBankDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const result = await BanksDetailServices.getSingleBankDetailFromDB(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Bank detail fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateBankDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const result = await BanksDetailServices.updateBankDetailIntoDB(id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Bank detail updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBankDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const result = await BanksDetailServices.deleteBankDetailFromDB(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Bank detail deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const BanksDetailControllers = {
  createBankDetail,
  getAllBankDetails,
  getSingleBankDetail,
  updateBankDetail,
  deleteBankDetail,
};