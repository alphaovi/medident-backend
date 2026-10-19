import express from "express";
import { InventoryControllers } from "./inventory.controller.js";

const router = express.Router();

router.get("/", InventoryControllers.getAllInventories);
router.get("/:productId", InventoryControllers.getSingleInventory);
router.put("/:productId", InventoryControllers.updateInventory); // <-- Ei route ti lagbe

export const InventoryRoutes = router;