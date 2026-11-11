import { z } from "zod";

const updateInventoryZodSchema = z.object({
  body: z.object({
    group: z.string().optional(),
    subGroup: z.string().optional(),
    totalStock: z.number().min(0, "Total stock cannot be negative").optional(),
    purchaseReturn: z.number().min(0, "Purchase return cannot be negative").optional(),
    sellReturn: z.number().min(0, "Sell return cannot be negative").optional(),
    totalSell: z.number().min(0, "Total sell cannot be negative").optional(),
    currentStock: z.number().min(0, "Current stock cannot be negative").optional(),
    onTransit: z.number().min(0, "On transit cannot be negative").optional(),
    damaged: z.number().min(0, "Damaged cannot be negative").optional(),
    lost: z.number().min(0, "Lost cannot be negative").optional(),
    freeSample: z.number().min(0, "Free sample cannot be negative").optional(),
    incomingQty: z.number().min(0, "Incoming qty cannot be negative").optional(),
    incomingUnitCost: z.number().min(0, "Incoming unit cost cannot be negative").optional(),
    avgBuyingPrice: z.number().min(0, "Average buying price cannot be negative").optional(),
    totalStockValue: z.number().min(0, "Total stock value cannot be negative").optional(),
    totalSaleValue: z.number().min(0, "Total sale value cannot be negative").optional(),
  }),
});

export const InventoryValidation = {
  updateInventoryZodSchema,
};