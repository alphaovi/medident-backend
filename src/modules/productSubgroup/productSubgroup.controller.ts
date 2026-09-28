import { Request, Response } from "express";
import { ProductSubgroupServices } from "./productSubgroup.service.js";

const createProductSubgroup = async (req: Request, res: Response) => {
  try {
    const { productSubgroup } = req.body;

    const result =
      await ProductSubgroupServices.createProductSubgroupIntoDB(
        productSubgroup
      );

    res.status(201).json({
      success: true,
      message: "Product subgroup created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const getAllProductSubgroups = async (req: Request, res: Response) => {
  try {
    const group = req.query.group as string | undefined;

    const result =
      await ProductSubgroupServices.getAllProductSubgroupsFromDB(group);

    res.status(200).json({
      success: true,
      message: "Product subgroups retrieved successfully",
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
const getSingleProductSubgroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const result =
      await ProductSubgroupServices.getSingleProductSubgroupFromDB(id);

    res.status(200).json({
      success: true,
      message: "Product subgroup retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const updateProductSubgroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const { productSubgroup } = req.body;

    const result = await ProductSubgroupServices.updateProductSubgroupIntoDB(
      id,
      productSubgroup
    );

    res.status(200).json({
      success: true,
      message: "Product subgroup updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const deleteSingleProductSubgroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const result =
      await ProductSubgroupServices.deleteSingleProductSubgroupFromDB(id);

    res.status(200).json({
      success: true,
      message: "Product subgroup deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const ProductSubgroupControllers = {
  createProductSubgroup,
  getAllProductSubgroups,
  getSingleProductSubgroup,
  updateProductSubgroup,
  deleteSingleProductSubgroup,
};
