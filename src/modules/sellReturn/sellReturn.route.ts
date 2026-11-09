import { Router } from "express";
import { createSellReturn, getAllSellReturns, getSellReturnById, updateSellReturn } from "./sellReturn.controller.js";

const router = Router();

router.post("/", createSellReturn);
router.get("/", getAllSellReturns);
router.get("/:id", getSellReturnById);
router.put("/:id", updateSellReturn); // <--- Edit Route

export const SellReturnRoutes = router;