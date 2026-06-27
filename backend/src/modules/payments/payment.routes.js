import { Router } from 'express';
import * as controller from './payment.controller.js';
import { processPaymentSchema } from './payment.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/process', authMiddleware, validate(processPaymentSchema), controller.processPayment);
router.post('/webhook', controller.handleWebhook);
router.get('/mock-redirect', controller.handleMockRedirect);

export default router;
