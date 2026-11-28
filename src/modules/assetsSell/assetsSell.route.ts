// assetsSell.route.ts
import { Router } from "express";
import { AssetsSellController } from "./assetsSell.controller.js";

const router = Router();

router.post("/", AssetsSellController.createAssetSell);
router.get("/", AssetsSellController.getAllAssetSells);
router.get("/:id", AssetsSellController.getSingleAssetSell);
router.delete("/:id", AssetsSellController.deleteAssetSell);

export const AssetsSellRoutes = router;