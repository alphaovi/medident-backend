import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware.js";
import { ExpenseServices } from "./expense.service.js";

const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.createExpenseIntoDB(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.getAllExpensesFromDB(req.user, req.query);
    return res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getApprovedExpenseReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.getApprovedExpenseReportsFromDB(
      req.user,
      req.query
    );
    return res.status(200).json({
      success: true,
      message: "Approved expense reports fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.getSingleExpenseFromDB(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateExpenseStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.updateExpenseStatusIntoDB(
      req.params.id,
      req.body.status,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Expense status updated to ${req.body.status}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.updateExpenseIntoDB(
      req.params.id,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await ExpenseServices.deleteExpenseFromDB(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const ExpenseControllers = {
  createExpense,
  getAllExpenses,
  getApprovedExpenseReports,
  getSingleExpense,
  updateExpenseStatus,
  updateExpense,
  deleteExpense,
};