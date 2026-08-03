import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { bookingParamsSchema, bookingQuerySchema, createBookingSchema } from './booking.schema.js';
import * as bookingController from './booking.controller.js';

const router = Router();

router.get('/', validate({ query: bookingQuerySchema }), bookingController.getMyBookings);
router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get(
  '/:bookingId',
  validate({ params: bookingParamsSchema }),
  bookingController.getMyBookingById,
);
router.patch(
  '/:bookingId/cancel',
  validate({ params: bookingParamsSchema }),
  bookingController.cancelBooking,
);

export default router;
