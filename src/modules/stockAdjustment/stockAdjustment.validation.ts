import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const createStockAdjustmentZodSchema = z.object({
  body: z.object({
    product: z.string({ required_error: 'Product ID/Identifier is required' }),
    adjustmentType: z.enum(['Damaged', 'Lost', 'Free Sample'], {
      required_error: 'Adjustment type must be Damaged, Lost, or Free Sample'
    }),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    note: z.string().trim().optional(),
    date: z.string().datetime().optional().or(z.date().optional())
  })
});

// Zod Validation Middleware
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