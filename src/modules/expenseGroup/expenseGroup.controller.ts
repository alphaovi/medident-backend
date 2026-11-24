import { Request, Response } from "express";
import { ExpenseGroupService } from "./expenseGroup.service.js";

const createExpenseGroup = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseGroupService.createExpenseGroup(req.body);
    res.status(201).json({
      success: true,
      message: "Expense group created successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create expense group",
    });
  }
};

const getAllExpenseGroups = async (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.isActive === "true";
    const data = await ExpenseGroupService.getAllExpenseGroups(onlyActive);
    res.status(200).json({
      success: true,
      message: "Expense groups retrieved successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch expense groups",
    });
  }
};

const getSingleExpenseGroup = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseGroupService.getSingleExpenseGroup(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense group not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Expense group retrieved successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch expense group",
    });
  }
};

const updateExpenseGroup = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseGroupService.updateExpenseGroup(
      req.params.id,
      req.body
    );
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense group not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Expense group updated successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update expense group",
    });
  }
};

const deleteExpenseGroup = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseGroupService.deleteExpenseGroup(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense group not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Expense group deleted successfully",
      data,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete expense group",
    });
  }
};

export const ExpenseGroupController = {
  createExpenseGroup,
  getAllExpenseGroups,
  getSingleExpenseGroup,
  updateExpenseGroup,
  deleteExpenseGroup,
};