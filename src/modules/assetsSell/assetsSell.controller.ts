import { Request, Response, NextFunction } from "express";
import { AssetsSellService } from "./assetsSell.service.js";

const getSelectableAssets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const assetsGroup = String(req.query.assetsGroup || "").trim();
    const assetsSubGroup = String(req.query.assetsSubGroup || "").trim();

    if (!assetsGroup || !assetsSubGroup) {
      return res.status(400).json({
        success: false,
        message: "Both assetsGroup and assetsSubGroup query IDs are required",
      });
    }

    const data =
      await AssetsSellService.getSelectableAssetsByGroupAndSubGroupFromDB(
        assetsGroup,
        assetsSubGroup
      );

    return res.status(200).json({
      success: true,
      message: "Selectable assets retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createAssetsSell = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AssetsSellService.createAssetsSellIntoDB(req.body);
    return res.status(201).json({
      success: true,
      message: "Asset sell recorded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllAssetsSell = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AssetsSellService.getAllAssetsSellFromDB(req.query);
    return res.status(200).json({
      success: true,
      message: "Asset sell records retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleAssetsSell = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AssetsSellService.getSingleAssetsSellByIdFromDB(
      req.params.id
    );
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Asset sell record not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Asset sell record retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateAssetsSell = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AssetsSellService.updateAssetsSellIntoDB(
      req.params.id,
      req.body
    );
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Asset sell record not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Asset sell record updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAssetsSell = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AssetsSellService.deleteAssetsSellFromDB(req.params.id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Asset sell record not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Asset sell record deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const AssetsSellController = {
  getSelectableAssets,
  createAssetsSell,
  getAllAssetsSell,
  getSingleAssetsSell,
  updateAssetsSell,
  deleteAssetsSell,
};