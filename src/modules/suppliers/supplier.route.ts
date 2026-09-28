import express from "express";
import { SupplierControllers } from "./supplier.controller.js";


const router = express.Router();

router.post(
  "/create-supplier",
  SupplierControllers.createSupplier
);

router.get("/", SupplierControllers.getAllSuppliers);

router.get(
  "/:supplierId",
  SupplierControllers.getSingleSupplier
);

router.patch(
  "/:supplierId",
  SupplierControllers.updateSupplier
);

router.delete(
  "/:supplierId",
  SupplierControllers.deleteSupplier
);

export const supplierRoutes = router;