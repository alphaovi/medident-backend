
import { Request, Response } from "express";
import { SaleOrderServices } from "./salesOrder.service.js";

const handleError = (error: unknown, res: Response) => {
  console.error(error);

  const message =
    error instanceof Error ? error.message : "Something went wrong";

  const statusCode =
    message.includes("not found") ? 404 :
    message.includes("Invalid") ||
    message.includes("required") ||
    message.includes("Insufficient stock") ||
    message.includes("Invalid quantity") ||
    message.includes("Invalid price") ? 400 : 500;

  return res.status(statusCode).json({
    success: false,
    message,
    error: message,
  });
};

// CREATE SALE ORDER
const createSaleOrder = async (req: Request, res: Response) => {
  try {
    const { saleOrder } = req.body;

    if (!saleOrder || typeof saleOrder !== "object") {
      return res.status(400).json({
        success: false,
        message: "Sale order data is required",
      });
    }

    const result = await SaleOrderServices.createSaleOrderIntoDB(saleOrder);

    return res.status(201).json({
      success: true,
      message: "Sale order created successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// GET ALL SALE ORDERS
const getAllSaleOrders = async (req: Request, res: Response) => {
  try {
    const result = await SaleOrderServices.getAllSaleOrdersFromDB();

    return res.status(200).json({
      success: true,
      message: "Sale orders retrieved successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// GET SINGLE SALE ORDER
const getSaleOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sale order ID is required",
      });
    }

    const result = await SaleOrderServices.getSaleOrderByIdFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sale order not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sale order retrieved successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// UPDATE SALE ORDER
const updateSaleOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { saleOrder } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sale order ID is required",
      });
    }

    if (!saleOrder || typeof saleOrder !== "object") {
      return res.status(400).json({
        success: false,
        message: "Sale order data is required",
      });
    }

    const result = await SaleOrderServices.updateSaleOrderIntoDB(
      id,
      saleOrder
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sale order not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sale order updated successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// UPDATE SALE ORDER STATUS
const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const allowedStatuses = ["pending", "approved", "delivered"];

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sale order ID is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        allowedStatuses,
      });
    }

    const result = await SaleOrderServices.updateSaleOrderStatusIntoDB(
      id,
      status
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sale order not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Sale order status updated to ${status} successfully`,
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// DELETE SALE ORDER
const deleteSaleOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sale order ID is required",
      });
    }

    const result = await SaleOrderServices.deleteSaleOrderFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sale order not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sale order deleted successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const SaleOrderControllers = {
  createSaleOrder,
  getAllSaleOrders,
  getSaleOrder,
  updateSaleOrder,
  updateOrderStatus,
  deleteSaleOrder,
};
