import { Request, Response } from "express";
import { InventoryServices } from "./inventory.service.js";

const getAllInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await InventoryServices.getAllInventoryFromDB();

    res.status(200).json({
      success: true,
      message: "Inventory retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const getSingleInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const productId = String(req.params.productId);

    const result =
      await InventoryServices.getSingleInventoryFromDB(
        productId
      );

    res.status(200).json({
      success: true,
      message: "Inventory retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const InventoryControllers = {
  getAllInventory,
  getSingleInventory,
};