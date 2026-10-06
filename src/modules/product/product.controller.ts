import { Request, Response } from "express";
import { ProductServices } from "./product.service.js";

const createProduct = async (req: Request, res: Response) => {
  try {
    const result = await ProductServices.createProductIntoDB(req.body);
    res.status(201).json({ success: true, message: "Product created successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await ProductServices.getAllProductsFromDB();
    res.status(200).json({ success: true, message: "Products retrieved successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const result = await ProductServices.getSingleProductFromDB(req.params.id);
    res.status(200).json({ success: true, message: "Product retrieved successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const result = await ProductServices.updateProductInDB(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Product updated successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  try {
    const result = await ProductServices.deleteProductFromDB(req.params.id);
    res.status(200).json({ success: true, message: "Product deleted successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Something went wrong", error });
  }
};

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};