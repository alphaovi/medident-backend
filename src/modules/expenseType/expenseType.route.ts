import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ExpenseTypeController } from "./expenseType.controller.js";
import {
  createExpenseTypeValidation,
  updateExpenseTypeValidation,
} from "./expenseType.validation.js";

const validateRequest =
  (schema: z.ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error,
      });
    }
  };

const router = Router();

router.post(
  "/",
  validateRequest(createExpenseTypeValidation),
  ExpenseTypeController.createExpenseType
);
router.get("/", ExpenseTypeController.getAllExpenseTypes);
router.get("/:id", ExpenseTypeController.getSingleExpenseType);
router.patch(
  "/:id",
  validateRequest(updateExpenseTypeValidation),
  ExpenseTypeController.updateExpenseType
);
router.delete("/:id", ExpenseTypeController.deleteExpenseType);

export const ExpenseTypeRoutes = router;