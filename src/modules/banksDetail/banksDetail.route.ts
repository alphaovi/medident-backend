import express from "express";
import { BanksDetailControllers } from "./banksDetail.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  createBankDetailValidationSchema,
  updateBankDetailValidationSchema,
} from "./banksDetail.validation.js";

const router = express.Router();

router.post(
  "/create-bank-detail",
  verifyJWT,
  validateRequest(createBankDetailValidationSchema),
  BanksDetailControllers.createBankDetail
);

router.get("/", verifyJWT, BanksDetailControllers.getAllBankDetails);
router.get("/:id", verifyJWT, BanksDetailControllers.getSingleBankDetail);

router.patch(
  "/:id",
  verifyJWT,
  validateRequest(updateBankDetailValidationSchema),
  BanksDetailControllers.updateBankDetail
);

router.delete("/:id", verifyJWT, BanksDetailControllers.deleteBankDetail);

export const BanksDetailRoutes = router;