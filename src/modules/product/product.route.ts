import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { ProductControllers } from "./product.controller.js";
import { ProductValidation } from "./product.validation.js";

const router = Router();

router.post(
  "/create-product",
  validateRequest(ProductValidation.createProductZodSchema),
  ProductControllers.createProduct
);
router.get("/", ProductControllers.getAllProducts);
router.get("/:id", ProductControllers.getSingleProduct);
router.patch(
  "/:id",
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductControllers.updateProduct
);
router.delete("/:id", ProductControllers.deleteProduct);

export const ProductRoutes = router;
