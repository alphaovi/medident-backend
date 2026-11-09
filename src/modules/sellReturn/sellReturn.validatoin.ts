import { z } from "zod";

const sellReturnItemValidationSchema = z.object({
  state: z.string({ required_error: "State is required" }),
  customer: z.string({ required_error: "Customer ID is required" }),
  group: z.string({ required_error: "Group ID is required" }),
  subGroup: z.string({ required_error: "SubGroup ID is required" }),
  product: z.string({ required_error: "Product ID is required" }),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().optional(),
  discountAmount: z.number().optional(),
  totalPrice: z.number(),
  afterDiscount: z.number(),
});

export const createSellReturnValidationSchema = z.object({
  body: z.object({
    stateOrRegion: z.string({ required_error: "State or Region is required" }),
    customer: z.string({ required_error: "Customer is required" }),
    returnDate: z.string().optional(),
    products: z.array(sellReturnItemValidationSchema).min(1, "At least one product is required for return"),
    generalDiscountType: z.enum(["percentage", "fixed"]).optional(),
    generalDiscountValue: z.number().optional(),
    grandTotal: z.number({ required_error: "Grand total is required" }),
    status: z.enum(["completed", "pending"]).optional(),
  }),
});