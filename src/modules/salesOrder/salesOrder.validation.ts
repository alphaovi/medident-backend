import { z } from "zod";

const orderItemValidationSchema = z.object({
  group: z.string({ required_error: "Group ID is required" }).trim().min(1, "Group ID is required"),
  subGroup: z.string({ required_error: "Sub-group ID is required" }).trim().min(1, "Sub-group ID is required"),
  product: z.string({ required_error: "Product ID is required" }).trim().min(1, "Product ID is required"),
  quantity: z.number({ required_error: "Quantity must be a number" }).int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  discount: z.number({ required_error: "Discount must be a number" }).min(0, "Discount cannot be negative").optional(),
});

export const createSaleOrderValidationSchema = z.object({
  body: z.object({
    saleOrder: z.object({
      stateOrRegion: z.string({ required_error: "State / Region is required" }).trim().min(1, "State / Region is required"),
      customer: z.string({ required_error: "Customer ID is required" }).trim().min(1, "Customer ID is required"),
      orderDate: z.union([z.string().min(1, "Order date is required"), z.date()]),
      products: z.array(orderItemValidationSchema).min(1, "At least one product is required"),
      generalDiscountType: z.enum(["%", "flat"]).optional(),
      generalDiscountValue: z.number({ required_error: "General discount must be a number" }).min(0, "General discount cannot be negative").optional(),
      paidAmount: z.number({ required_error: "Paid amount must be a number" }).min(0, "Paid amount cannot be negative"),
    }),
  }),
});