import { z } from "zod";

export const getSingleInventoryValidationSchema = z.object({
  params: z.object({
    productId: z
      .string({ error: "Product ID is required" })
      .trim()
      .min(1, "Product ID is required"),
  }),
});