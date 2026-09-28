import express from "express";
import { InventoryControllers } from "./inventory.controller.js";

const router = express.Router();

router.get(
  "/",
  InventoryControllers.getAllInventory
);

router.get(
  "/:productId",
  InventoryControllers.getSingleInventory
);

export const inventoryRoutes = router;