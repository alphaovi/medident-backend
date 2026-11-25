import { Router } from "express";
import { AssetsGroupController } from "./assetsGroup.controller.js";

const router = Router();

router.post("/", AssetsGroupController.createAssetGroup);
router.get("/", AssetsGroupController.getAllAssetGroups);
router.get("/:id", AssetsGroupController.getSingleAssetGroup);
router.patch("/:id", AssetsGroupController.updateAssetGroup);
router.delete("/:id", AssetsGroupController.deleteAssetGroup);

export const AssetsGroupRoutes = router;