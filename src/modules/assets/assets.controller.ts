import { Request, Response } from "express";
import { AssetsService } from "./assets.service.js";

const createAssets = async (req: Request, res: Response) => {
  try {
    const result = await AssetsService.createAssetsIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "Assets created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to create assets",
    });
  }
};

const getAllAssets = async (req: Request, res: Response) => {
  try {
    const result = await AssetsService.getAllAssetsFromDB(req.query);
    res.status(200).json({
      success: true,
      message: "Assets retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve assets",
    });
  }
};

const getAssetDepreciationReport = async (req: Request, res: Response) => {
  try {
    const result = await AssetsService.getAssetDepreciationReportFromDB(
      req.query
    );
    res.status(200).json({
      success: true,
      message: "Asset depreciation report retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve asset depreciation report",
    });
  }
};

const getSingleAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsService.getSingleAssetByIdFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assets record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assets record retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to retrieve assets record",
    });
  }
};

const updateAssets = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsService.updateAssetsIntoDB(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assets record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assets updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to update assets",
    });
  }
};

const addAssetItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsService.addAssetItemIntoDB(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assets record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset item added to array successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to add asset item",
    });
  }
};

const removeAssetItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const result = await AssetsService.removeAssetItemFromDB(id, itemId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assets record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset item removed from array successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to remove asset item",
    });
  }
};

const deleteAssets = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssetsService.deleteAssetsFromDB(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assets record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assets record deleted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to delete assets record",
    });
  }
};

export const AssetsController = {
  createAssets,
  getAllAssets,
  getAssetDepreciationReport,
  getSingleAsset,
  updateAssets,
  addAssetItem,
  removeAssetItem,
  deleteAssets,
};