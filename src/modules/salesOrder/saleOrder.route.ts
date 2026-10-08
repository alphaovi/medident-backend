import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { 
  createSaleOrderValidationSchema, 
  updateOrderStatusValidationSchema 
} from "./salesOrder.validation.js";
import { SaleOrderControllers } from "./saleOrder.controller.js";

const router = express.Router();

// Create Sale Order
router.post(
  "/create-sale-order",
  validateRequest(createSaleOrderValidationSchema),
  SaleOrderControllers.createSaleOrder
);

// Get All Sale Orders
router.get("/", SaleOrderControllers.getAllSaleOrders);

// Get Single Sale Order by ID
router.get("/:id", SaleOrderControllers.getSaleOrder);

// Update Sale Order Status (Patch)
router.patch(
  "/:id/status",
  validateRequest(updateOrderStatusValidationSchema),
  SaleOrderControllers.updateOrderStatus
);

// Delete Sale Order
router.delete("/:id", SaleOrderControllers.deleteSaleOrder);

export const saleOrderRoutes = router;