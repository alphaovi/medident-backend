import { z } from "zod";

const orderItemValidationSchema = z.object({
  group: z.string().min(1),
  subGroup: z.string().min(1),
  product: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),

  // Strict validation without optional/skipping
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.number().min(0),

  discount: z.number().min(0).optional(),
  totalPrice: z.number().optional(),
  afterDiscount: z.number().optional(),
});

const paymentValidationSchema = z.object({
  amount: z.number().positive(),
  date: z.coerce.date(),
});

const saleOrderDataValidationSchema = z.object({
  stateOrRegion: z.string().min(1),
  customer: z.string().min(1),
  orderDate: z.coerce.date(),

  products: z.array(orderItemValidationSchema).min(1),

  generalDiscountType: z.enum(["%", "flat"]).default("%"),
  generalDiscountValue: z.number().min(0).default(0),

  paidAmount: z.number().min(0).default(0),
  payments: z.array(paymentValidationSchema).optional(),

  grandTotal: z.number().min(0).optional(),
  dueAmount: z.number().min(0).optional(),

  status: z.enum(["pending", "approved", "delivered"]).default("pending"),
});

const createSaleOrderValidationSchema = z.object({
  saleOrder: saleOrderDataValidationSchema,
});

const updateOrderStatusValidationSchema = z.object({
  status: z.enum(["pending", "approved", "delivered"]),
});

export {
  createSaleOrderValidationSchema,
  updateOrderStatusValidationSchema,
};