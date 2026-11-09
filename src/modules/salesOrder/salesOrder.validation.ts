import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const paymentSchema = z.object({
  date: z.string().datetime().optional().or(z.date().optional()),
  amount: z.number().min(0, 'Amount cannot be negative'),
  paymentMethod: z.string().optional()
});

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
});

export const createSaleOrderZodSchema = z.object({
  body: z.object({
    saleOrder: z.object({
      stateOrRegion: z.string({ required_error: 'State or region is required' }),
      customer: z.string({ required_error: 'Customer ID is required' }),
      orderDate: z.string().datetime().optional().or(z.date().optional()),
      products: z.array(productItemSchema).min(1, 'At least one product is required'),
      generalDiscountType: z.enum(['percentage', 'fixed']).optional(),
      generalDiscountValue: z.number().min(0).optional(),
      payments: z.array(paymentSchema).optional(),
      status: z.enum(['pending', 'approved', 'delivered']).optional()
    })
  })
});

export const updateSaleOrderZodSchema = z.object({
  body: z.object({
    saleOrder: z.object({
      stateOrRegion: z.string().optional(),
      customer: z.string().optional(),
      orderDate: z.string().datetime().optional().or(z.date().optional()),
      products: z.array(productItemSchema).min(1).optional(),
      generalDiscountType: z.enum(['percentage', 'fixed']).optional(),
      generalDiscountValue: z.number().min(0).optional(),
      payments: z.array(paymentSchema).optional(),
      status: z.enum(['pending', 'approved', 'delivered']).optional()
    }).optional()
  })
});

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