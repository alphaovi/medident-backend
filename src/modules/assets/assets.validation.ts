import { z } from "zod";

const assetItemValidationSchema = z.object({
  assetName: z.string().min(1, "Asset name is required"),
  assetCode: z.string().optional().default(""),
  purchaseDate: z.union([z.string(), z.date()]).optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  depreciationPeriod: z.enum(["monthly", "yearly"]).optional().default("yearly"),
  depreciationMode: z.enum(["percentage", "amount"]).optional().default("percentage"),
  depreciationValue: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().default(""),
});

export const createAssetsValidationSchema = z.object({
  body: z.object({
    assetsGroup: z.string().min(1, "Asset group is required"),
    assetsSubGroup: z.string().min(1, "Asset sub-group is required"),
    paidBy: z.string().optional().nullable(),
    paidFrom: z.string().optional().nullable(),
    assets: z
      .array(assetItemValidationSchema)
      .min(1, "At least one asset item is required"),
  }),
});

export const updateAssetsValidationSchema = z.object({
  body: z.object({
    assetsGroup: z.string().optional(),
    assetsSubGroup: z.string().optional(),
    paidBy: z.string().optional().nullable(),
    paidFrom: z.string().optional().nullable(),
    assets: z.array(assetItemValidationSchema).optional(),
  }),
});