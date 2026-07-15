import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import aircraftRoutes from '../modules/aircrafts/aircraft.routes.js';
import airlineRoutes from '../modules/airlines/airline.routes.js';
import airportRoutes from '../modules/airports/airport.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import baggageRoutes from '../modules/baggage/baggage.routes.js';
import bookingRoutes from '../modules/bookings/booking.routes.js';
import discountRoutes from '../modules/discounts/discount.routes.js';
import flightRoutes from '../modules/flights/flight.routes.js';
import mealRoutes from '../modules/meals/meal.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import passengerRoutes from '../modules/passengers/passenger.routes.js';
import paymentRoutes from '../modules/payments/payment.routes.js';
import { handlePaymentWebhook, verifyPaymentWebhookSignature } from '../modules/payments/payment.webhook.js';
import { paymentWebhookSchema } from '../modules/payments/payment.schema.js';
import reviewRoutes from '../modules/reviews/review.routes.js';
import seatRoutes from '../modules/seats/seat.routes.js';
import userRoutes from '../modules/users/user.routes.js';

const router = Router();

router.use('/auth', authRateLimiter, authRoutes);

router.post('/payments/webhook', verifyPaymentWebhookSignature, (req, res, next) => {
  const result = paymentWebhookSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) });
  }

  req.body = result.data;
  return handlePaymentWebhook(req, res, next);
});

router.use('/aircrafts', aircraftRoutes);
router.use('/airlines', airlineRoutes);
router.use('/airports', airportRoutes);
router.use('/baggage', baggageRoutes);
router.use('/discounts', discountRoutes);
router.use('/flights', flightRoutes);
router.use('/meals', mealRoutes);
router.use('/reviews', reviewRoutes);
router.use('/seats', seatRoutes);

router.use('/admin', authenticate, requireRole('admin'), adminRoutes);
router.use('/bookings', authenticate, bookingRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/passengers', authenticate, passengerRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/users', authenticate, userRoutes);

export default router;
