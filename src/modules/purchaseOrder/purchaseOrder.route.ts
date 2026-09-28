import express from "express";

import { PurchaseOrderControllers } from "./purchaseOrder.controller.js";

const router =
  express.Router();

router.post(
  "/create-purchase-order",
  PurchaseOrderControllers.createPurchaseOrder
);

router.get(
  "/",
  PurchaseOrderControllers.getAllPurchaseOrders
);

router.get(
  "/:purchaseId",
  PurchaseOrderControllers.getSinglePurchaseOrder
);

router.patch(
  "/:purchaseId/receive",
  PurchaseOrderControllers.receivePurchaseOrder
);

export const purchaseOrderRoutes =
  router;