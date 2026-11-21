import express from "express";
import { BanksDetailControllers } from "./banksDetail.controller.js";

const router = express.Router();

router.post("/create-bank-detail", BanksDetailControllers.createBankDetail);
router.get("/", BanksDetailControllers.getAllBankDetails);
router.get("/:id", BanksDetailControllers.getSingleBankDetail);
router.patch("/:id", BanksDetailControllers.updateBankDetail);
router.delete("/:id", BanksDetailControllers.deleteBankDetail);

export const BanksDetailRoutes = router;