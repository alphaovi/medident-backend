import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const assetItemZodSchema = z.object({
  assetName: z
    .string({
      required_error: "Asset name is required",
    })
    .trim()
    .min(1, "Asset name cannot be empty"),
  assetCode: z.string().trim().optional(),
  purchaseDate: z
    .union([z.string(), z.date()])
    .optional(),
  quantity: z.coerce
    .number({
      required_error: "Quantity is required",
    })
    .min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce
    .number({
      required_error: "Unit price is required",
    })
    .min(0, "Unit price cannot be negative"),
  depreciationPeriod: z.enum(["monthly", "yearly"], {
    required_error: "Depreciation period must be 'monthly' or 'yearly'",
  }),
  depreciationMode: z.enum(["amount", "percentage"], {
    required_error: "Depreciation mode must be 'amount' or 'percentage'",
  }),
  depreciationValue: z.coerce
    .number({
      required_error: "Depreciation value is required",
    })
    .min(0, "Depreciation value cannot be negative"),
  elapsedPeriods: z.coerce
    .number()
    .min(0, "Elapsed periods cannot be negative")
    .optional(),
  notes: z.string().trim().optional(),
});

const createAssetsValidationSchema = z.object({
  body: z.object({
    assetsGroup: z
      .string({
        required_error: "Asset group ID is required",
      })
      .trim()
      .regex(objectIdRegex, "Invalid Asset Group ObjectId"),
    assetsSubGroup: z
      .string({
        required_error: "Asset sub-group ID is required",
      })
      .trim()
      .regex(objectIdRegex, "Invalid Asset Sub-Group ObjectId"),
    assets: z
      .array(assetItemZodSchema)
      .min(1, "At least one asset item is required"),
  }),
});

const updateAssetsValidationSchema = z.object({
  body: z.object({
    assetsGroup: z
      .string()
      .trim()
      .regex(objectIdRegex, "Invalid Asset Group ObjectId")
      .optional(),
    assetsSubGroup: z
      .string()
      .trim()
      .regex(objectIdRegex, "Invalid Asset Sub-Group ObjectId")
      .optional(),
    assets: z.array(assetItemZodSchema).min(1).optional(),
  }),
});

const addAssetItemValidationSchema = z.object({
  body: assetItemZodSchema,
});

export const AssetsValidation = {
  createAssetsValidationSchema,
  updateAssetsValidationSchema,
  addAssetItemValidationSchema,
};