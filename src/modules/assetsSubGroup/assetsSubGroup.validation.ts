import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createAssetSubGroupValidationSchema = z.object({
  body: z.object({
    groupId: z
      .string({
        required_error: "Asset group ID is required",
      })
      .trim()
      .regex(objectIdRegex, "Invalid Asset Group ObjectId"),
    subGroupName: z
      .string({
        required_error: "Asset sub-group name is required",
      })
      .trim()
      .min(2, "Sub-group name must be at least 2 characters long")
      .max(100, "Sub-group name must not exceed 100 characters"),
    description: z.string().trim().max(300).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateAssetSubGroupValidationSchema = z.object({
  body: z.object({
    groupId: z
      .string()
      .trim()
      .regex(objectIdRegex, "Invalid Asset Group ObjectId")
      .optional(),
    subGroupName: z
      .string()
      .trim()
      .min(2, "Sub-group name must be at least 2 characters long")
      .max(100, "Sub-group name must not exceed 100 characters")
      .optional(),
    description: z.string().trim().max(300).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const AssetsSubGroupValidation = {
  createAssetSubGroupValidationSchema,
  updateAssetSubGroupValidationSchema,
};