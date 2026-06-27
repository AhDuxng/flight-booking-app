import { Router } from 'express';
import * as controller from './booking.controller.js';
import { createBookingSchema, getBookingByIdSchema } from './booking.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createBookingSchema), controller.createBooking);
router.get('/', controller.getBookings);
router.get('/:id', validate(getBookingByIdSchema), controller.getBookingDetails);
router.post('/:id/cancel', validate(getBookingByIdSchema), controller.cancelBooking);

export default router;
