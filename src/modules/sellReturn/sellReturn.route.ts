import { Router } from "express";
import { createSellReturnValidationSchema } from "./sellReturn.validatoin.js";
import { createSellReturn, getAllSellReturns } from "./sellReturn.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post("/", validateRequest(createSellReturnValidationSchema), createSellReturn);
router.get("/", getAllSellReturns);

export const SellReturnRoutes = router;