import { Request, Response } from 'express';
import { StockAdjustmentServices } from './stockAdjustment.service.js';

export class StockAdjustmentController {
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await StockAdjustmentServices.createStockAdjustmentIntoDB(req.body);
      res.status(201).json({
        success: true,
        message: 'Stock Adjustment created successfully!',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create stock adjustment'
      });
    }
  }

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await StockAdjustmentServices.getAllStockAdjustmentsFromDB();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}