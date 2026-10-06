import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { PurchaseOrderControllers } from "./purchaseOrder.controller.js";
import { PurchaseOrderValidation } from "./purchaseOrder.validation.js";

const router = Router();

router.post("/create-purchase-order", validateRequest(PurchaseOrderValidation.createPurchaseOrderZodSchema), PurchaseOrderControllers.createPurchaseOrder);
router.get("/", PurchaseOrderControllers.getAllPurchaseOrders);
router.get("/:purchaseId", PurchaseOrderControllers.getSinglePurchaseOrder);
router.patch("/:purchaseId", PurchaseOrderControllers.updatePurchaseOrder); // নতুন আপডেট রাউট

export const PurchaseOrderRoutes = router;