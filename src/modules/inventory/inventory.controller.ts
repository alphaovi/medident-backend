import { Request, Response } from "express";
import { InventoryServices } from "./inventory.service.js";

const getAllInventories = async (req: Request, res: Response) => {
  try {
    const result = await InventoryServices.getAllInventoriesFromDB();
    res.status(200).json({ success: true, message: "Inventory retrieved successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const getSingleInventory = async (req: Request, res: Response) => {
  try {
    const result = await InventoryServices.getSingleInventoryFromDB(req.params.productId);
    res.status(200).json({ success: true, message: "Inventory retrieved successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

export const InventoryControllers = {
  getAllInventories,
  getSingleInventory,
};