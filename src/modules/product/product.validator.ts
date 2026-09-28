import { z } from "zod";

const capitalizeWords = (value: string) => {
  return value
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
};

const objectIdValidation = z
  .string({
    error: "ObjectId is required",
  })
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

export const createProductValidationSchema =
  z.object({
    body: z.object({
      productDetails: z.object({
        id: z
          .string({
            error: "Product id is required",
          })
          .trim()
          .min(1, "Product id cannot be empty"),

        name: z
          .string({
            error: "Product name is required",
          })
          .trim()
          .min(1, "Product name cannot be empty")
          .transform(capitalizeWords),

        group: objectIdValidation,

        subGroup: objectIdValidation,

        unit: z
          .number({
            error: "Unit must be a number",
          })
          .min(0, "Unit cannot be negative"),

        weight: z
          .number({
            error: "Weight must be a number",
          })
          .min(0, "Weight cannot be negative"),

        purchasePrice: z
          .number({
            error: "Purchase price must be a number",
          })
          .min(
            0,
            "Purchase price cannot be negative"
          ),

        sellingPrice: z
          .number({
            error: "Selling price must be a number",
          })
          .min(
            0,
            "Selling price cannot be negative"
          ),
      }),
    }),
  });

export const updateProductValidationSchema =
  z.object({
    body: z.object({
      productDetails: z
        .object({
          id: z
            .string()
            .trim()
            .min(
              1,
              "Product id cannot be empty"
            )
            .optional(),

          name: z
            .string()
            .trim()
            .min(
              1,
              "Product name cannot be empty"
            )
            .transform(capitalizeWords)
            .optional(),

          group:
            objectIdValidation.optional(),

          subGroup:
            objectIdValidation.optional(),

          unit: z
            .number()
            .min(
              0,
              "Unit cannot be negative"
            )
            .optional(),

          weight: z
            .number()
            .min(
              0,
              "Weight cannot be negative"
            )
            .optional(),

          purchasePrice: z
            .number()
            .min(
              0,
              "Purchase price cannot be negative"
            )
            .optional(),

          sellingPrice: z
            .number()
            .min(
              0,
              "Selling price cannot be negative"
            )
            .optional(),
        })
        .refine(
          (data) =>
            data.id !== undefined ||
            data.name !== undefined ||
            data.group !== undefined ||
            data.subGroup !== undefined ||
            data.unit !== undefined ||
            data.weight !== undefined ||
            data.purchasePrice !== undefined ||
            data.sellingPrice !== undefined,
          {
            message:
              "At least one field is required for update",
          }
        ),
    }),
  });

export type CreateProductInput = z.infer<
  typeof createProductValidationSchema
>;

export type UpdateProductInput = z.infer<
  typeof updateProductValidationSchema
>;