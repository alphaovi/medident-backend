import express from "express";

import validateRequest from "../../middlewares/validateRequest.js";
import { createSaleOrderValidationSchema } from "./salesOrder.validation.js";
import { SaleOrderControllers } from "./saleOrder.controller.js";


const router = express.Router();

router.post(
  "/create-sale-order",
  validateRequest(createSaleOrderValidationSchema),
  SaleOrderControllers.createSaleOrder
);

router.get("/:id", SaleOrderControllers.getSaleOrder);

export const saleOrderRoutes = router;
