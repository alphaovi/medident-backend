import { z } from "zod";

const createAssetGroupValidationSchema = z.object({
  body: z.object({
    groupName: z
      .string({
        required_error: "Asset group name is required",
      })
      .trim()
      .min(2, "Group name must be at least 2 characters long")
      .max(100, "Group name must not exceed 100 characters"),
    description: z.string().trim().max(300).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateAssetGroupValidationSchema = z.object({
  body: z.object({
    groupName: z
      .string()
      .trim()
      .min(2, "Group name must be at least 2 characters long")
      .max(100, "Group name must not exceed 100 characters")
      .optional(),
    description: z.string().trim().max(300).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const AssetsGroupValidation = {
  createAssetGroupValidationSchema,
  updateAssetGroupValidationSchema,
};