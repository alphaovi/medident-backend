import { Request, Response } from "express";
import { SaleOrderServices } from "./salesOrder.service.js";

const createSaleOrder = async (req: Request, res: Response) => {
  try {
    const { saleOrder } = req.body;
    const result = await SaleOrderServices.createSaleOrderIntoDB(saleOrder);

    res.status(201).json({
      success: true,
      message: "Sale order created successfully",
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

const getSaleOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await SaleOrderServices.getSaleOrderById(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Sale order not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Sale order retrieved successfully",
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

export const SaleOrderControllers = {
  createSaleOrder,
  getSaleOrder,
};