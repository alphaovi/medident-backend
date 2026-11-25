import { Request, Response } from "express";
import { AssetsSubGroupService } from "./assetsSubGroup.service.js";

const createAssetSubGroup = async (req: Request, res: Response) => {
  try {
    const result = await AssetsSubGroupService.createAssetSubGroupIntoDB(
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Asset sub-group created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to create asset sub-group",
    });
  }
};

const getAllAssetSubGroups = async (req: Request, res: Response) => {
  try {
    const result = await AssetsSubGroupService.getAllAssetSubGroupsFromDB(
      req.query
    );
    res.status(200).json({
      success: true,
      message: "Asset sub-groups retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve asset sub-groups",
    });
  }
};

const getSingleAssetSubGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsSubGroupService.getSingleAssetSubGroupFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset sub-group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset sub-group retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to retrieve asset sub-group",
    });
  }
};

const getSubGroupsByGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const result =
      await AssetsSubGroupService.getSubGroupsByGroupIdFromDB(groupId);

    res.status(200).json({
      success: true,
      message: "Sub-groups for the asset group retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to retrieve sub-groups by group",
    });
  }
};

const updateAssetSubGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsSubGroupService.updateAssetSubGroupIntoDB(
      id,
      req.body
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset sub-group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset sub-group updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to update asset sub-group",
    });
  }
};

const deleteAssetSubGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsSubGroupService.deleteAssetSubGroupFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset sub-group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset sub-group deleted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to delete asset sub-group",
    });
  }
};

export const AssetsSubGroupController = {
  createAssetSubGroup,
  getAllAssetSubGroups,
  getSingleAssetSubGroup,
  getSubGroupsByGroup,
  updateAssetSubGroup,
  deleteAssetSubGroup,
};