import { Request, Response } from "express";
import { PurchaseOrderServices } from "./purchaseOrder.service.js";

const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const result = await PurchaseOrderServices.createPurchaseOrderIntoDB(req.body);
    res.status(201).json({ success: true, message: "Purchase order created successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const getAllPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const result = await PurchaseOrderServices.getAllPurchaseOrdersFromDB();
    res.status(200).json({ success: true, message: "Purchase orders retrieved successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const getSinglePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const result = await PurchaseOrderServices.getSinglePurchaseOrderFromDB(req.params.purchaseId);
    res.status(200).json({ success: true, message: "Purchase order retrieved successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const result = await PurchaseOrderServices.updatePurchaseOrderInDB(req.params.purchaseId, req.body);
    res.status(200).json({ success: true, message: "Purchase order updated successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

export const PurchaseOrderControllers = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getSinglePurchaseOrder,
  updatePurchaseOrder,
};