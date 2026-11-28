import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z
  .string({ required_error: "ObjectId is required" })
  .refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid MongoDB ObjectId",
  });

const assetSellItemZodSchema = z.object({
  assetsRecordId: objectIdSchema,
  assetItemId: objectIdSchema,
  sellQuantity: z.coerce
    .number({ required_error: "Sell quantity is required" })
    .min(1, "Sell quantity must be at least 1"),
  sellPrice: z.coerce
    .number({ required_error: "Sell price is required" })
    .min(0, "Sell price cannot be negative"),
  notes: z.string().trim().optional(),
});

export const createAssetsSellValidationSchema = z.object({
  body: z.object({
    sellDate: z.union([z.string(), z.date()]).optional(),
    assetsGroup: objectIdSchema,
    assetsSubGroup: objectIdSchema,
    receivedBy: objectIdSchema.optional().nullable(),
    depositToBank: objectIdSchema.optional().nullable(),
    customerName: z.string().trim().optional(),
    customerPhone: z.string().trim().optional(),
    soldItems: z
      .array(assetSellItemZodSchema)
      .min(1, "At least one item must be selected to sell"),
    notes: z.string().trim().optional(),
  }),
});

export const updateAssetsSellValidationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    sellDate: z.union([z.string(), z.date()]).optional(),
    customerName: z.string().trim().optional(),
    customerPhone: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
});