import { z } from "zod";

const createProductZodSchema = z.object({
  body: z.object({
    id: z.string({ required_error: "Product ID is required" }),
    name: z.string({ required_error: "Product name is required" }),
    code: z.string({ required_error: "Product code is required" }),
    group: z.string({ required_error: "Group ID is required" }),
    subGroup: z.string({ required_error: "SubGroup ID is required" }),
    purchasePrice: z.number({ required_error: "Purchase price is required" }),
    sellingPrice: z.number({ required_error: "Selling price is required" }),
    unit: z.string({ required_error: "Unit is required" }),
    weight: z.number().optional().default(0),
  }),
});

const updateProductZodSchema = z.object({
  body: createProductZodSchema.shape.body.partial(),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
};