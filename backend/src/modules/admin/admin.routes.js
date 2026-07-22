import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { createFlightSchema, flightParamsSchema, updateFlightSchema } from '../flights/flight.schema.js';
import { adminBookingParamsSchema, adminBookingQuerySchema, adminListQuerySchema, adminPaymentParamsSchema, adminReviewParamsSchema, adminUserParamsSchema, moderateReviewSchema, processCashPaymentSchema } from './admin.schema.js';
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
router.post('/bookings/:bookingId/cancel', validate({ params: adminBookingParamsSchema }), adminController.cancelBooking);
router.get('/payments', validate({ query: adminListQuerySchema }), adminController.getPayments);
router.post('/payments/:paymentId/process', validate({ params: adminPaymentParamsSchema, body: processCashPaymentSchema }), adminController.processCashPayment);
router.post('/payments/:paymentId/refund', validate({ params: adminPaymentParamsSchema }), adminController.refundPayment);
router.get('/reviews', validate({ query: adminListQuerySchema }), adminController.getReviews);
router.patch('/reviews/:reviewId', validate({ params: adminReviewParamsSchema, body: moderateReviewSchema }), adminController.moderateReview);
router.get('/users', validate({ query: adminListQuerySchema }), adminController.getUsers);
router.get('/users/:userId', validate({ params: adminUserParamsSchema }), adminController.getUserById);

export default router;
