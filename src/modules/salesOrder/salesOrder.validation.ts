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

<<<<<<< HEAD
const productItemSchema = z.object({
<<<<<<< HEAD
  state: z.string({ required_error: 'State is required' }),
  customer: z.string({ required_error: 'Customer ID is required' }),
=======
  state: z.string().optional(),
  customer: z.string().optional(),
>>>>>>> main
  group: z.string({ required_error: 'Group is required' }),
  subGroup: z.string({ required_error: 'SubGroup is required' }),
  product: z.string({ required_error: 'Product ID is required' }),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discountType: z.enum(['percentage', 'fixed']),
<<<<<<< HEAD
  discountValue: z.number().min(0, 'Discount value cannot be negative')
});

export const createSaleOrderZodSchema = z.object({
  body: z.object({
    orderDate: z.string().datetime().optional().or(z.date().optional()),
    products: z.array(productItemSchema).min(1, 'At least one product is required'),
    generalDiscountType: z.enum(['percentage', 'fixed']).optional(),
    generalDiscountValue: z.number().min(0).optional(),
    payments: z.array(paymentSchema).optional(),
    status: z.enum(['pending', 'approved', 'delivered']).optional()
  })
});

// Zod Validation Middleware
=======
  discountValue: z.number().min(0, 'Discount value cannot be negative'),
  discountAmount: z.number().min(0).optional(),
  totalPrice: z.number().min(0).optional(),
  afterDiscount: z.number().min(0).optional()
=======
const paymentValidationSchema = z.object({
  date: z.string().optional(),
  amount: z.number().min(0),
  paymentMethod: z.string().optional(),
>>>>>>> main
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

<<<<<<< HEAD
>>>>>>> main
export const validateZod = (schema: z.AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.errors ? error.errors.map((err: any) => err.message) : error.message
      });
    }
  };
};
=======
export const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "delivered", "cancelled"]),
  }),
});
>>>>>>> main
