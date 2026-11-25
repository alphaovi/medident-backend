import { Router } from "express";
import { AssetsSubGroupController } from "./assetsSubGroup.controller.js";

const router = Router();

router.post("/", AssetsSubGroupController.createAssetSubGroup);
router.get("/", AssetsSubGroupController.getAllAssetSubGroups);
router.get("/group/:groupId", AssetsSubGroupController.getSubGroupsByGroup);
router.get("/:id", AssetsSubGroupController.getSingleAssetSubGroup);
router.patch("/:id", AssetsSubGroupController.updateAssetSubGroup);
router.delete("/:id", AssetsSubGroupController.deleteAssetSubGroup);

export const AssetsSubGroupRoutes = router;