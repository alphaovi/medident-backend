import { z } from "zod";

const createProductZodSchema = z.object({
  body: z.object({
    id: z
      .string({ required_error: "Product ID is required" })
      .max(10, { message: "Product ID cannot exceed 10 characters" }),
    name: z.string({ required_error: "Product name is required" }),
    code: z.string({ required_error: "Product code is required" }),
    group: z.string({ required_error: "Group ID is required" }),
    subGroup: z.string({ required_error: "SubGroup ID is required" }),
    purchasePrice: z.preprocess(
      (val) => (val !== '' && val !== undefined ? Number(val) : val),
      z.number({ required_error: "Purchase price is required" })
    ),
    sellingPrice: z.preprocess(
      (val) => (val !== '' && val !== undefined ? Number(val) : val),
      z.number({ required_error: "Selling price is required" })
    ),
    unit: z.string({ required_error: "Unit is required" }),
    weight: z.preprocess(
      (val) => (val !== '' && val !== undefined ? Number(val) : val),
      z.number().optional().default(0)
    ),
  }),
});

// ✅ আপডেট স্কিমাটিকে আরও ফ্লেক্সিবল করা হলো যাতে সরাসরি বডি বা product অবজেক্ট—দুটোই সাপোর্ট করে
const updateProductZodSchema = z.object({
  body: z.object({
    id: z.string().max(10).optional(),
    name: z.string().optional(),
    code: z.string().optional(),
    group: z.string().optional(),
    subGroup: z.string().optional(),
    purchasePrice: z.preprocess(
      (val) => (val !== '' && val !== undefined ? Number(val) : val),
      z.number().optional()
    ),
    sellingPrice: z.preprocess(
      (val) => (val !== '' && val !== undefined ? Number(val) : val),
      z.number().optional()
    ),
    unit: z.string().optional(),
    weight: z.preprocess(
      (val) => (val !== '' && val !== undefined ? Number(val) : val),
      z.number().optional()
    ),
  }).optional(),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
};