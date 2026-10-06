import { z } from "zod";

export const createStockAdjustmentValidationSchema = z.object({
  body: z.object({
    stockAdjustment: z.object({
      product: z.string({ required_error: "Product ID is required" }).trim().min(1, "Product ID is required"),
      adjustmentType: z.enum(["Damaged", "Lost", "Free Sample"], {
        required_error: "Adjustment type is required",
      }),
      quantity: z.number({ required_error: "Quantity is required" }).int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
      note: z.string().optional(),
      date: z.union([z.string().min(1), z.date()]).optional(),
    }),
  }),
});