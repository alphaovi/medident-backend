import express from "express";
import { SalesOrderControllers } from "./salesOrder.controller.js";

const router = express.Router();

router.post("/create-sale-order", SalesOrderControllers.createSalesOrder);
router.get("/", SalesOrderControllers.getAllSalesOrders);
router.get("/:id", SalesOrderControllers.getSingleSalesOrder);
router.patch("/:id", SalesOrderControllers.updateSalesOrder); // 🟢 PUT কে PATCH করা হলো
router.patch("/:id/status", SalesOrderControllers.updateOrderStatus);
router.delete("/:id", SalesOrderControllers.deleteSalesOrder);

export const SalesOrderRoutes = router;