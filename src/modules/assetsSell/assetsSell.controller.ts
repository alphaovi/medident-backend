// assetsSell.controller.ts
import { Request, Response } from "express";
import { AssetsSellService } from "./assetsSell.service.js";

const createAssetSell = async (req: Request, res: Response) => {
  try {
    const result = await AssetsSellService.createAssetSellIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "Asset sell created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || "Failed to create asset sell",
    });
  }
};

const getAllAssetSells = async (req: Request, res: Response) => {
  try {
    const result = await AssetsSellService.getAllAssetSellsFromDB(req.query);
    res.status(200).json({
      success: true,
      message: "Asset sell records retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve asset sell records",
    });
  }
};

const getSingleAssetSell = async (req: Request, res: Response) => {
  try {
    const result = await AssetsSellService.getSingleAssetSellByIdFromDB(
      req.params.id
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset sell record not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Asset sell record retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to retrieve asset sell record",
    });
  }
};

const deleteAssetSell = async (req: Request, res: Response) => {
  try {
    const result = await AssetsSellService.deleteAssetSellFromDB(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Asset sell record not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Asset sell record deleted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || "Failed to delete asset sell record",
    });
  }
};

export const AssetsSellController = {
  createAssetSell,
  getAllAssetSells,
  getSingleAssetSell,
  deleteAssetSell,
};