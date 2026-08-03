import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { passengerBookingParamsSchema } from './passenger.schema.js';
import * as passengerController from './passenger.controller.js';

const router = Router();

router.get(
  '/bookings/:bookingId',
  validate({ params: passengerBookingParamsSchema }),
  passengerController.getPassengersByBooking,
);

export default router;
