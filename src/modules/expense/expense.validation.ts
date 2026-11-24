import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z
  .string({ required_error: "ObjectId is required" })
  .refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid MongoDB ObjectId",
  });

const expenseStatusSchema = z.enum(["pending", "hold", "approve"]);

export const createExpenseValidationSchema = z.object({
  body: z.object({
    date: z
      .union([z.string(), z.date()])
      .optional()
      .refine((val) => val === undefined || !Number.isNaN(new Date(val).getTime()), {
        message: "Invalid date format",
      }),
    expenseGroup: objectIdSchema,
    expenseType: objectIdSchema,
    paidBy: objectIdSchema,
    paidFrom: objectIdSchema,
    amount: z.coerce
      .number({ required_error: "Amount is required" })
      .positive("Amount must be greater than 0"),
    notes: z.string().trim().optional().default(""),
    status: expenseStatusSchema.optional().default("pending"),
  }),
});

export const updateExpenseValidationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    date: z
      .union([z.string(), z.date()])
      .optional()
      .refine((val) => val === undefined || !Number.isNaN(new Date(val).getTime()), {
        message: "Invalid date format",
      }),
    expenseGroup: objectIdSchema.optional(),
    expenseType: objectIdSchema.optional(),
    paidBy: objectIdSchema.optional(),
    paidFrom: objectIdSchema.optional(),
    amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
    notes: z.string().trim().optional(),
    status: expenseStatusSchema.optional(),
  }),
});

export const updateExpenseStatusValidationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: expenseStatusSchema,
  }),
});