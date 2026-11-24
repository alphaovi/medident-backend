import { z } from "zod";

export const createExpenseGroupValidation = z.object({
  body: z.object({
    expenseGroupName: z
      .string({ required_error: "Expense group name is required" })
      .trim()
      .min(1, "Expense group name cannot be empty"),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateExpenseGroupValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid ID"),
  }),
  body: z.object({
    expenseGroupName: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type TCreateExpenseGroupInput = z.infer<
  typeof createExpenseGroupValidation
>["body"];

export type TUpdateExpenseGroupInput = z.infer<
  typeof updateExpenseGroupValidation
>["body"];