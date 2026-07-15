import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createPaymentIntentSchema,
  paymentBookingParamsSchema,
  verifyPaymentSchema,
} from './payment.schema.js';
import * as paymentController from './payment.controller.js';

const router = Router();

router.post('/intent', validate(createPaymentIntentSchema), paymentController.createPaymentIntent);
router.get(
  '/bookings/:bookingId',
  validate({ params: paymentBookingParamsSchema }),
  paymentController.getPaymentsByBooking,
);
router.post('/verify', validate(verifyPaymentSchema), paymentController.getPaymentStatus);

export default router;
