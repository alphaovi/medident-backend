import { z } from "zod";

const saleItemValidationSchema = z.object({
  state: z.string({ required_error: "State is required" }),
  customer: z.string({ required_error: "Customer ID is required" }),
  group: z.string({ required_error: "Group ID is required" }),
  subGroup: z.string({ required_error: "SubGroup ID is required" }),
  product: z.string({ required_error: "Product ID is required" }),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  discountValue: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalPrice: z.number().min(0),
  afterDiscount: z.number().min(0),
});

const paymentValidationSchema = z.object({
  date: z.string().optional(),
  amount: z.number().min(0),
  paymentMethod: z.string().optional(),
});

export const createSalesOrderValidationSchema = z.object({
  body: z.object({
    saleOrder: z.object({
      stateOrRegion: z.string({ required_error: "State or Region is required" }),
      customer: z.string({ required_error: "Customer is required" }),
      orderDate: z.string().optional(),
      products: z.array(saleItemValidationSchema).min(1, "At least one product is required"),
      generalDiscountType: z.enum(["percentage", "fixed"]).default("percentage"),
      generalDiscountValue: z.number().min(0).default(0),
      paidAmount: z.number().min(0).optional(),
      payments: z.array(paymentValidationSchema).optional(),
      status: z.enum(["pending", "approved", "delivered", "cancelled"]).optional(),
    }),
  }),
});

export const updateSalesOrderValidationSchema = z.object({
  body: z.object({
    saleOrder: createSalesOrderValidationSchema.shape.body.shape.saleOrder.partial(),
  }),
});

export const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "delivered", "cancelled"]),
  }),
});