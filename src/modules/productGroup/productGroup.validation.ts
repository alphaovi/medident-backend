import { z } from "zod";

const capitalizeWords = (value: string) => {
  return value
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
};

export const createProductGroupValidationSchema = z.object({
  body: z.object({
    productGroup: z.object({
      id: z
        .string({
          required_error: "Product group id is required",
        })
        .trim()
        .min(1, "Product group id cannot be empty")
        .optional(), // Jodi frontend theke auto-generate hoy, tahobe optional rakhte paren

      groupName: z
        .string({
          required_error: "Group name is required",
        })
        .trim()
        .min(1, "Group name cannot be empty")
        .transform(capitalizeWords),
    }),
  }),
});

// --- UPDATE VALIDATION SCHEMA ---
export const updateProductGroupValidationSchema = z.object({
  body: z.object({
    productGroup: z.object({
      id: z.string().trim().min(1).optional(),
      groupName: z
        .string()
        .trim()
        .min(1, "Group name cannot be empty")
        .transform(capitalizeWords)
        .optional(),
    }),
  }),
});

export type CreateProductGroupInput = z.infer<
  typeof createProductGroupValidationSchema
>;
export type UpdateProductGroupInput = z.infer<
  typeof updateProductGroupValidationSchema
>;