import { Request, Response } from "express";
import { AssetsGroupService } from "./assetsGroup.service.js";

const createAssetGroup = async (req: Request, res: Response) => {
  try {
    const result = await AssetsGroupService.createAssetGroupIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "Asset group created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to create asset group",
    });
  }
};

const getAllAssetGroups = async (req: Request, res: Response) => {
  try {
    const result = await AssetsGroupService.getAllAssetGroupsFromDB(req.query);
    res.status(200).json({
      success: true,
      message: "Asset groups retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve asset groups",
    });
  }
};

const getSingleAssetGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsGroupService.getSingleAssetGroupFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset group retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to retrieve asset group",
    });
  }
};

const updateAssetGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsGroupService.updateAssetGroupIntoDB(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset group updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to update asset group",
    });
  }
};

const deleteAssetGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsGroupService.deleteAssetGroupFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset group deleted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to delete asset group",
    });
  }
};

export const AssetsGroupController = {
  createAssetGroup,
  getAllAssetGroups,
  getSingleAssetGroup,
  updateAssetGroup,
  deleteAssetGroup,
};