import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { AssetsSellController } from "./assetsSell.controller.js";
import {
  createAssetsSellValidationSchema,
  updateAssetsSellValidationSchema,
} from "./assetsSell.validation.js";

const router = express.Router();

router.get("/available-assets", AssetsSellController.getSelectableAssets);
router.post(
  "/",
  validateRequest(createAssetsSellValidationSchema),
  AssetsSellController.createAssetsSell
);
router.get("/", AssetsSellController.getAllAssetsSell);
router.get("/:id", AssetsSellController.getSingleAssetsSell);
router.patch(
  "/:id",
  validateRequest(updateAssetsSellValidationSchema),
  AssetsSellController.updateAssetsSell
);
router.delete("/:id", AssetsSellController.deleteAssetsSell);

export const AssetsSellRoutes = router;