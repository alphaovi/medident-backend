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

const objectIdValidation = z
  .string({
    error: "Product group id is required",
  })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid product group ObjectId");

export const createProductSubgroupValidationSchema = z.object({
  body: z.object({
    productSubgroup: z.object({
      id: z
        .string({
          error: "Product subgroup id is required",
        })
        .trim()
        .min(1, "Product subgroup id cannot be empty"),

      group: objectIdValidation,

      subGroupName: z
        .string({
          error: "Subgroup name is required",
        })
        .trim()
        .min(1, "Subgroup name cannot be empty")
        .transform(capitalizeWords),
    }),
  }),
});

export const updateProductSubgroupValidationSchema = z.object({
  body: z.object({
    productSubgroup: z
      .object({
        id: z
          .string()
          .trim()
          .min(1, "Product subgroup id cannot be empty")
          .optional(),

        group: objectIdValidation.optional(),

        subGroupName: z
          .string()
          .trim()
          .min(1, "Subgroup name cannot be empty")
          .transform(capitalizeWords)
          .optional(),
      })
      .refine(
        (data) =>
          data.id !== undefined ||
          data.group !== undefined ||
          data.subGroupName !== undefined,
        {
          message: "At least one field is required for update",
        }
      ),
  }),
});

export type CreateProductSubgroupInput = z.infer<
  typeof createProductSubgroupValidationSchema
>;

export type UpdateProductSubgroupInput = z.infer<
  typeof updateProductSubgroupValidationSchema
>;