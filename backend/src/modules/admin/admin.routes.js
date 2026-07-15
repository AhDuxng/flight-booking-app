import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { createFlightSchema, flightParamsSchema, updateFlightSchema } from '../flights/flight.schema.js';
import { adminBookingQuerySchema, adminListQuerySchema } from './admin.schema.js';
import * as adminController from './admin.controller.js';

const router = Router();

router.get('/dashboard', adminController.getDashboard);
router.get('/flights', validate({ query: adminListQuerySchema }), adminController.getFlights);
router.post('/flights', validate(createFlightSchema), adminController.createFlight);
router.patch(
  '/flights/:flightId',
  validate({ params: flightParamsSchema, body: updateFlightSchema }),
  adminController.updateFlight,
);
router.get('/bookings', validate({ query: adminBookingQuerySchema }), adminController.getBookings);
router.get('/payments', validate({ query: adminListQuerySchema }), adminController.getPayments);
router.get('/reviews', validate({ query: adminListQuerySchema }), adminController.getReviews);
router.get('/users', validate({ query: adminListQuerySchema }), adminController.getUsers);

export default router;
