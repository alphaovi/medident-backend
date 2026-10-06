import { Router } from "express";
import { InventoryControllers } from "./inventory.controller.js";

const router = Router();

router.get("/", InventoryControllers.getAllInventories);
router.get("/:productId", InventoryControllers.getSingleInventory);

export const InventoryRoutes = router;