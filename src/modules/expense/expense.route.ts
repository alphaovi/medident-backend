import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { ExpenseControllers } from "./expense.controller.js";
import {
  createExpenseValidationSchema,
  updateExpenseStatusValidationSchema,
  updateExpenseValidationSchema,
} from "./expense.validation.js";

const router = express.Router();

router.post(
  "/create-expense",
  verifyJWT,
  validateRequest(createExpenseValidationSchema),
  ExpenseControllers.createExpense
);

// সব এক্সপেন্স লিস্ট (pending, hold, approve সব দেখাবে)
router.get("/", verifyJWT, ExpenseControllers.getAllExpenses);

// শুধুমাত্র Approved এক্সপেন্স রিপোর্টের জন্য
router.get("/reports", verifyJWT, ExpenseControllers.getApprovedExpenseReports);

router.get("/:id", verifyJWT, ExpenseControllers.getSingleExpense);

// Admin কর্তৃক স্ট্যাটাস পরিবর্তন (pending / hold / approve)
router.patch(
  "/:id/status",
  verifyJWT,
  validateRequest(updateExpenseStatusValidationSchema),
  ExpenseControllers.updateExpenseStatus
);

// এক্সপেন্স এডিট ও আপডেট
router.patch(
  "/:id",
  verifyJWT,
  validateRequest(updateExpenseValidationSchema),
  ExpenseControllers.updateExpense
);

router.delete("/:id", verifyJWT, ExpenseControllers.deleteExpense);

export const ExpenseRoutes = router;