import { Request, Response } from 'express';
import { SaleOrderService } from './salesOrder.service.js';

export class SaleOrderController {
  public static async create(req: Request, res: Response): Promise<void> {
    try {
<<<<<<< HEAD
      const result = await SaleOrderService.createOrder(req.body);
=======
      const result = await SaleOrderService.createOrder(req.body.saleOrder);
>>>>>>> main
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
<<<<<<< HEAD
=======

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SaleOrderService.updateOrder(id, req.body.saleOrder || req.body);
      
      if (!result) {
        res.status(404).json({ success: false, message: 'Order not found for update' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sale Order updated successfully!',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update sale order'
      });
    }
  }

  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await SaleOrderService.updateStatus(id, status);

      if (!result) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully!',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update status'
      });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SaleOrderService.deleteOrder(id);

      if (!result) {
        res.status(404).json({ success: false, message: 'Order not found for deletion' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sale Order deleted successfully!',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete sale order'
      });
    }
  }
>>>>>>> main
}