import { Request, Response } from "express";
import { ProductGroupServices } from "./productGroup.service.js";

const createProductGroup = async (req: Request, res: Response) => {
  try {
    const { productGroup } = req.body;

    const result =
      await ProductGroupServices.createProductGroupIntoDB(productGroup);

    res.status(201).json({
      success: true,
      message: "Product group created successfully",
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

const getAllProductGroups = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await ProductGroupServices.getAllProductGroupsFromDB();

    res.status(200).json({
      success: true,
      message: "Product groups retrieved successfully",
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

const getSingleProductGroup = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const result =
      await ProductGroupServices.getSingleProductGroupFromDB(id);

    res.status(200).json({
      success: true,
      message: "Product group retrieved successfully",
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

const deleteSingleProductGroup = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const result =
      await ProductGroupServices.deleteSingleProductGroupFromDB(id);

    res.status(200).json({
      success: true,
      message: "Product group deleted successfully",
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

export const ProductGroupControllers = {
  createProductGroup,
  getAllProductGroups,
  getSingleProductGroup,
  deleteSingleProductGroup,
};