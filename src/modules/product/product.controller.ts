import { Request, Response } from "express";
import { ProductDetailsServices } from "./product.service.js";

const createProductDetail = async (
  req: Request,
  res: Response
) => {
  try {
    const { productDetails } = req.body;

    const result =
      await ProductDetailsServices.CreateProductIntoDB(
        productDetails
      );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
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

const getAllProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await ProductDetailsServices.getAllProductsFromDB();

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
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

const getSingleProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const result =
      await ProductDetailsServices.getSingleProductFromDB(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
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

const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const { productDetails } = req.body;

    const result =
      await ProductDetailsServices.updateProductIntoDB(
        id,
        productDetails
      );

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
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

const deleteSingleProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const result =
      await ProductDetailsServices.deleteSingleProductFromDB(
        id
      );

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
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

export const ProductDetailsControllers = {
  createProductDetail,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteSingleProduct,
};