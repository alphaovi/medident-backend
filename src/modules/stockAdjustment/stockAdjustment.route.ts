import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { StockAdjustmentControllers } from "./stockAdjustment.controller.js";
import { createStockAdjustmentValidationSchema } from "./stockAdjustment.validation.js";

const router = Router();

router.post(
  "/create-stock-adjustment",
  validateRequest(createStockAdjustmentValidationSchema), // এখানে সঠিক স্কিমাটি পাস করা হলো
  StockAdjustmentControllers.createStockAdjustment
);

router.get("/", StockAdjustmentControllers.getAllStockAdjustments);

export const stockAdjustmentRoutes = router;