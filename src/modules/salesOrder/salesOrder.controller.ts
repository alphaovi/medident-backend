import { Request, Response, NextFunction } from "express";
import { SalesOrderServices } from "./salesOrder.service.js";

// 1. Create Sales Order Controller with Console Logs
const createSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // console.log("📥 [BACKEND CONTROLLER] req.body received:", JSON.stringify(req.body, null, 2));

    const result = await SalesOrderServices.createSalesOrderIntoDB(req.body);

    return res.status(201).json({
      success: true,
      message: "Sale order created successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ [CONTROLLER ERROR]:", error);
    next(error);
  }
};

// 2. Get All Sales Orders Controller
const getAllSalesOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SalesOrderServices.getAllSalesOrdersFromDB();
    return res.status(200).json({
      success: true,
      message: "Sales orders fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Sales Order Controller
const getSingleSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await SalesOrderServices.getSingleSalesOrderFromDB(id);
    return res.status(200).json({
      success: true,
      message: "Sales order fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Sales Order Controller
const updateSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await SalesOrderServices.updateSalesOrderIntoDB(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Sales order updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Order Status Controller
const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await SalesOrderServices.updateOrderStatusInDB(id, status);
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Sales Order Controller
const deleteSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await SalesOrderServices.deleteSalesOrderFromDB(id);
    return res.status(200).json({
      success: true,
      message: "Sales order deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerStatement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fromDate, toDate, paymentStatus } = req.query;

    const result = await SalesOrderServices.getCustomerStatementFromDB({
      customerId,
      fromDate,
      toDate,
      paymentStatus,
    });

    res.status(200).json({
      success: true,
      message: "Customer statement fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const SalesOrderControllers = {
  createSalesOrder,
  getAllSalesOrders,
  getSingleSalesOrder,
  updateSalesOrder,
  updateOrderStatus,
  deleteSalesOrder,
  getCustomerStatement
};