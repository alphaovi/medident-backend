import { Router } from "express";
import { AssetsController } from "./assets.controller.js";

const router = Router();

router.post("/", AssetsController.createAssets);
router.get("/", AssetsController.getAllAssets);
router.get("/report/depreciation", AssetsController.getAssetDepreciationReport);
router.get("/:id", AssetsController.getSingleAsset);
router.patch("/:id", AssetsController.updateAssets);
router.post("/:id/items", AssetsController.addAssetItem);
router.delete("/:id/items/:itemId", AssetsController.removeAssetItem);
router.delete("/:id", AssetsController.deleteAssets);

export const AssetsRoutes = router;