import express from "express";
import { ProductGroupControllers } from "./productGroup.controller.js";

import { createProductGroupValidationSchema } from "./productGroup.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post(
  "/create-product-group",
  validateRequest(createProductGroupValidationSchema),
  ProductGroupControllers.createProductGroup
);

router.get("/", ProductGroupControllers.getAllProductGroups);

router.get("/:id", ProductGroupControllers.getSingleProductGroup);

router.delete("/:id", ProductGroupControllers.deleteSingleProductGroup);

export const productGroupRoutes = router;
