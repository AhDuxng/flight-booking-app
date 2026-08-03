import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateDiscountSchema } from './discount.schema.js';
import * as discountController from './discount.controller.js';

const router = Router();

router.get('/active', discountController.getActiveDiscounts);
router.post('/validate', validate(validateDiscountSchema), discountController.validateDiscount);

export default router;
