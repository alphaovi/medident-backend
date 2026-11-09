import { Request, Response } from "express";
import { SellReturnService } from "./sellReturn.service.js";

export const createSellReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SellReturnService.createSellReturn(req.body);
    res.status(201).json({
      success: true,
      message: "Sell return processed successfully and inventory updated!",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process sell return",
    });
  }
};

export const getAllSellReturns = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SellReturnService.getAllSellReturns();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sell returns",
    });
  }
};

export const getSellReturnById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SellReturnService.getSellReturnById(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, message: "Sell return not found" });
      return;
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sell return details",
    });
  }
};