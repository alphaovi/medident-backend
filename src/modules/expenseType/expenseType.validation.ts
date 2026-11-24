import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z
  .string({ required_error: "ObjectId is required" })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectId",
  });

export const createExpenseTypeValidation = z.object({
  body: z.object({
    expenseTypeGroup: objectIdSchema,
    expenseTypeName: z
      .string({ required_error: "Expense type name is required" })
      .trim()
      .min(1, "Expense type name cannot be empty"),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateExpenseTypeValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    expenseTypeGroup: objectIdSchema.optional(),
    expenseTypeName: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type TCreateExpenseTypeInput = z.infer<
  typeof createExpenseTypeValidation
>["body"];

export type TUpdateExpenseTypeInput = z.infer<
  typeof updateExpenseTypeValidation
>["body"];