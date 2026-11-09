

const router = Router();

router.post('/create-sale-order', validateZod(createSaleOrderZodSchema), SaleOrderController.create);
router.get('/', SaleOrderController.getAll);
router.get('/:id', SaleOrderController.getById);
router.patch('/:id', validateZod(updateSaleOrderZodSchema), SaleOrderController.update);
router.patch('/:id/status', SaleOrderController.updateStatus);
router.delete('/:id', SaleOrderController.delete);

export const SaleOrderRoutes = router;