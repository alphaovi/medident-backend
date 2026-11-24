import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { ExpenseControllers } from "./expense.controller.js";
import {
  createExpenseValidationSchema,
  updateExpenseValidationSchema,
} from "./expense.validation.js";

const router = express.Router();

router.post(
  "/create-expense",
  verifyJWT,
  validateRequest(createExpenseValidationSchema),
  ExpenseControllers.createExpense
);

router.get("/", verifyJWT, ExpenseControllers.getAllExpenses);
router.get("/:id", verifyJWT, ExpenseControllers.getSingleExpense);

router.patch(
  "/:id",
  verifyJWT,
  validateRequest(updateExpenseValidationSchema),
  ExpenseControllers.updateExpense
);

router.delete("/:id", verifyJWT, ExpenseControllers.deleteExpense);

export const ExpenseRoutes = router;