import { Router } from 'express';
import * as controller from './discount.controller.js';
import { validateDiscountSchema } from './discount.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/validate', validate(validateDiscountSchema), controller.validateDiscount);

export default router;
