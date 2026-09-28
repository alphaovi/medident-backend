import { Request, Response } from "express";
import { EmployeeServices } from "./employee.service.js";

const createEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const { employee } = req.body;

    const result =
      await EmployeeServices.createEmployeeIntoDB(
        employee
      );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
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

const getAllEmployees = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await EmployeeServices.getAllEmployeesFromDB();

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
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

const getSingleEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const result =
      await EmployeeServices.getSingleEmployeeFromDB(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
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

const updateEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const { employee } = req.body;

    const result =
      await EmployeeServices.updateEmployeeIntoDB(
        id,
        employee
      );

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
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

const deleteSingleEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const result =
      await EmployeeServices.deleteSingleEmployeeFromDB(
        id
      );

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
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

export const EmployeeControllers = {
  createEmployee,
  getAllEmployees,
  getSingleEmployee,
  updateEmployee,
  deleteSingleEmployee,
};