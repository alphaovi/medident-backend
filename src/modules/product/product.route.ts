import express from "express";
import { ProductDetailsControllers } from "./product.controller.js";

import {
  createProductValidationSchema,
  updateProductValidationSchema,
} from "./product.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post(
  "/create-product",
  validateRequest(createProductValidationSchema),
  ProductDetailsControllers.createProductDetail
);

router.get("/", ProductDetailsControllers.getAllProducts);

router.get("/:id", ProductDetailsControllers.getSingleProduct);

router.patch(
  "/:id",
  validateRequest(updateProductValidationSchema),
  ProductDetailsControllers.updateProduct
);

router.delete("/:id", ProductDetailsControllers.deleteSingleProduct);

export const productRoutes = router;
