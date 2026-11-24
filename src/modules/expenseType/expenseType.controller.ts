import { Request, Response } from "express";
import { ExpenseTypeService } from "./expenseType.service.js";

const createExpenseType = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseTypeService.createExpenseType(req.body);
    res.status(201).json({
      success: true,
      message: "Expense type created successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create expense type",
    });
  }
};

const getAllExpenseTypes = async (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.isActive === "true";
    const data = await ExpenseTypeService.getAllExpenseTypes(onlyActive);
    res.status(200).json({
      success: true,
      message: "Expense types retrieved successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch expense types",
    });
  }
};

const getSingleExpenseType = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseTypeService.getSingleExpenseType(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense type not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Expense type retrieved successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch expense type",
    });
  }
};

const updateExpenseType = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseTypeService.updateExpenseType(
      req.params.id,
      req.body
    );
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense type not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Expense type updated successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update expense type",
    });
  }
};

const deleteExpenseType = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseTypeService.deleteExpenseType(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense type not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Expense type deleted successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete expense type",
    });
  }
};

export const ExpenseTypeController = {
  createExpenseType,
  getAllExpenseTypes,
  getSingleExpenseType,
  updateExpenseType,
  deleteExpenseType,
};