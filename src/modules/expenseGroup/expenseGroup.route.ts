import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ExpenseGroupController } from "./expenseGroup.controller.js";
import {
  createExpenseGroupValidation,
  updateExpenseGroupValidation,
} from "./expenseGroup.validation.js";

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
  validateRequest(createExpenseGroupValidation),
  ExpenseGroupController.createExpenseGroup
);
router.get("/", ExpenseGroupController.getAllExpenseGroups);
router.get("/:id", ExpenseGroupController.getSingleExpenseGroup);
router.patch(
  "/:id",
  validateRequest(updateExpenseGroupValidation),
  ExpenseGroupController.updateExpenseGroup
);
router.delete("/:id", ExpenseGroupController.deleteExpenseGroup);

export const ExpenseGroupRoutes = router;