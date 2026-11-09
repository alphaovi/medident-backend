import { Router } from 'express';
import { StockAdjustmentController } from './stockAdjustment.controller.js';
import { createStockAdjustmentZodSchema, validateZod } from './stockAdjustment.validation.js';

const router = Router();

router.post('/', validateZod(createStockAdjustmentZodSchema), StockAdjustmentController.create);
router.get('/', StockAdjustmentController.getAll);

export const StockAdjustmentRoutes = router;