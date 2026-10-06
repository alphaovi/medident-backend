import { z } from "zod";

const updateInventoryZodSchema = z.object({
  body: z.object({
    totalStock: z.number().min(0, "Total stock cannot be negative").optional(),
    totalSell: z.number().min(0, "Total sell cannot be negative").optional(),
    currentStock: z.number().min(0, "Current stock cannot be negative").optional(),
    onTransit: z.number().min(0, "On transit cannot be negative").optional(),
    avgBuyingPrice: z.number().min(0, "Average buying price cannot be negative").optional(),
    totalStockValue: z.number().min(0, "Total stock value cannot be negative").optional(),
    totalSaleValue: z.number().min(0, "Total sale value cannot be negative").optional(),
  }),
});

export const InventoryValidation = {
  updateInventoryZodSchema,
};