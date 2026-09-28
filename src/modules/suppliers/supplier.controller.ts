import { Request, Response } from "express";
import { SupplierServices } from "./supplier.service.js";


const createSupplier = async (req: Request, res: Response) => {
  try {
    const { supplier } = req.body;

    const result = await SupplierServices.createSupplierIntoDB(supplier);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const result = await SupplierServices.getAllSuppliersFromDB();

    res.status(200).json({
      success: true,
      message: "Suppliers retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

const getSingleSupplier = async (req: Request, res: Response) => {
  try {
    const supplierId = String(req.params.supplierId);

    const result =
      await SupplierServices.getSingleSupplierFromDB(supplierId);

    res.status(200).json({
      success: true,
      message: "Supplier retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

const updateSupplier = async (req: Request, res: Response) => {
  try {
    const supplierId = String(req.params.supplierId);

    const result = await SupplierServices.updateSupplierIntoDB(
      supplierId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const supplierId = String(req.params.supplierId);

    const result =
      await SupplierServices.deleteSupplierFromDB(supplierId);

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const SupplierControllers = {
  createSupplier,
  getAllSuppliers,
  getSingleSupplier,
  updateSupplier,
  deleteSupplier,
};