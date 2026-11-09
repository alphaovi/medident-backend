import { Request, Response } from 'express';
import { SaleOrderService } from './salesOrder.service.js';

export class SaleOrderController {
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await SaleOrderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Sale Order created successfully!',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create sale order'
      });
    }
  }

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await SaleOrderService.getAllOrders();
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

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const result = await SaleOrderService.getOrderById(req.params.id);
      if (!result) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }
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