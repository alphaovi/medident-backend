import { Request, Response } from "express";
import { PurchaseOrderServices } from "./purchaseOrder.service.js";

const createPurchaseOrder =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        purchaseOrder,
      } = req.body;

      const result =
        await PurchaseOrderServices.createPurchaseOrderIntoDB(
          purchaseOrder
        );

      res.status(201).json({
        success: true,
        message:
          "Purchase order created successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
        error:
          error instanceof Error
            ? error.message
            : error,
      });
    }
  };

const getAllPurchaseOrders =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await PurchaseOrderServices.getAllPurchaseOrdersFromDB();

      res.status(200).json({
        success: true,
        message:
          "Purchase orders retrieved successfully",
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

const getSinglePurchaseOrder =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const purchaseId =
        String(req.params.purchaseId);

      const result =
        await PurchaseOrderServices.getSinglePurchaseOrderFromDB(
          purchaseId
        );

      res.status(200).json({
        success: true,
        message:
          "Purchase order retrieved successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
        error:
          error instanceof Error
            ? error.message
            : error,
      });
    }
  };

const receivePurchaseOrder =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const purchaseId =
        String(req.params.purchaseId);

      const result =
        await PurchaseOrderServices.receivePurchaseOrder(
          purchaseId
        );

      res.status(200).json({
        success: true,
        message:
          "Purchase order received successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
        error:
          error instanceof Error
            ? error.message
            : error,
      });
    }
  };

export const PurchaseOrderControllers = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getSinglePurchaseOrder,
  receivePurchaseOrder,
};