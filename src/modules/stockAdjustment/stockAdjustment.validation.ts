import { z } from "zod";

export const createStockAdjustmentValidationSchema = z.object({
  body: z.object({
    stockAdjustment: z.object({
      product: z.string({ required_error: "Product ID is required" }).trim().min(1, "Product ID is required"),
      customer: z.string().optional(), // কাস্টমার অপশনাল ভ্যালিডেশন
      adjustmentType: z.enum(["Damaged", "Lost", "Free Sample"], {
        required_error: "Adjustment type is required",
      }),
      quantity: z.number({ required_error: "Quantity is required" }).int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
      referredBy: z.string().optional(),
      note: z.string().optional(),
      updatedBy: z.string({ required_error: "Updated by is required" }).trim().min(1, "Updated by is required"),
      date: z.union([z.string().min(1), z.date()]).optional(),
    }),
  }),
});

export const updateStockAdjustmentValidationSchema = z.object({
  body: z.object({
    stockAdjustment: z.object({
      product: z.string().trim().min(1).optional(),
      customer: z.string().optional(),
      adjustmentType: z.enum(["Damaged", "Lost", "Free Sample"]).optional(),
      quantity: z.number().int().min(1).optional(),
      referredBy: z.string().optional(),
      note: z.string().optional(),
      updatedBy: z.string().trim().min(1).optional(),
      date: z.union([z.string().min(1), z.date()]).optional(),
    }),
  }),
});