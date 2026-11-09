import { Router } from 'express';

import { createSaleOrderZodSchema, validateZod } from './salesOrder.validation.js';
import { SaleOrderController } from './saleOrder.controller.js';

const router = Router();

router.post('/', validateZod(createSaleOrderZodSchema), SaleOrderController.create);
router.get('/', SaleOrderController.getAll);
router.get('/:id', SaleOrderController.getById);

export const SaleOrderRoutes = router;