import { Request, Response } from "express";
import { StockAdjustmentServices } from "./stockAdjustment.service.js";

const createStockAdjustment = async (req: Request, res: Response) => {
  try {
    const { stockAdjustment } = req.body;
    const result = await StockAdjustmentServices.createStockAdjustmentIntoDB(stockAdjustment);

    res.status(201).json({
      success: true,
      message: "Stock adjustment created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

const getAllStockAdjustments = async (req: Request, res: Response) => {
  try {
    const result = await StockAdjustmentServices.getAllStockAdjustmentsFromDB();
    res.status(200).json({
      success: true,
      message: "Stock adjustments retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const StockAdjustmentControllers = {
  createStockAdjustment,
  getAllStockAdjustments,
};