import { Request, Response, NextFunction } from "express";
import { BanksDetailServices } from "./banksDetail.service.js";

const createBankDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BanksDetailServices.createBankDetailIntoDB(req.body);
    return res.status(201).json({
      success: true,
      message: "Bank detail created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBankDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BanksDetailServices.getAllBankDetailsFromDB();
    return res.status(200).json({
      success: true,
      message: "Bank details fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleBankDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await BanksDetailServices.getSingleBankDetailFromDB(id);
    return res.status(200).json({
      success: true,
      message: "Bank detail fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateBankDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await BanksDetailServices.updateBankDetailIntoDB(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Bank detail updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBankDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await BanksDetailServices.deleteBankDetailFromDB(id);
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