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
          error: "Product group id is required",
        })
        .trim()
        .min(1, "Product group id cannot be empty")
        .optional(), // Ekhane .optional() add kora holo

      groupName: z
        .string({
          error: "Group name is required",
        })
        .trim()
        .min(1, "Group name cannot be empty")
        .transform(capitalizeWords),
    }),
  }),
});

export type CreateProductGroupInput = z.infer<
  typeof createProductGroupValidationSchema
>;