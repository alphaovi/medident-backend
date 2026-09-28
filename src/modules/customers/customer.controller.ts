import { Request, Response } from "express";
import { CustomerServices } from "./customer.service.js";

const createCustomer = async (req: Request, res: Response) => {
  try {
    const result = await CustomerServices.createCustomerIntoDB(
      req.body.customer
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const getAllCustomers = async (req: Request, res: Response) => {
  try {
    // division স্ট্রিং কিনা তা নিশ্চিত করা হচ্ছে
    const division = typeof req.query.division === "string" ? req.query.division : undefined;

    const result = await CustomerServices.getAllCustomersFromDB(division);

    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const getSingleCustomer = async (req: Request, res: Response) => {
  try {
    // req.params.id অ্যারে হতে পারে, তাই চেক করে স্ট্রিং নেওয়া হচ্ছে
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const result = await CustomerServices.getSingleCustomerFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await CustomerServices.updateCustomerIntoDB(
      id,
      req.body.customer
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await CustomerServices.deleteSingleCustomerFromDB(id);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

export const CustomerControllers = {
  createCustomer,
  getAllCustomers,
  getSingleCustomer,
  updateCustomer,
  deleteCustomer,
};