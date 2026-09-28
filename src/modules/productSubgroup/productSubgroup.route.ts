import express from "express";
import { ProductSubgroupControllers } from "./productSubgroup.controller.js";

import {
  createProductSubgroupValidationSchema,
  updateProductSubgroupValidationSchema,
} from "./productSubgroup.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post(
  "/create-product-subgroup",
  validateRequest(createProductSubgroupValidationSchema),
  ProductSubgroupControllers.createProductSubgroup
);

router.get("/", ProductSubgroupControllers.getAllProductSubgroups);

router.get("/:id", ProductSubgroupControllers.getSingleProductSubgroup);

router.patch(
  "/:id",
  validateRequest(updateProductSubgroupValidationSchema),
  ProductSubgroupControllers.updateProductSubgroup
);

router.delete("/:id", ProductSubgroupControllers.deleteSingleProductSubgroup);

export const productSubgroupRoutes = router;
