import { Router } from 'express';

// Import routers
import authRouter from '../modules/auth/auth.routes.js';
import userRouter from '../modules/users/user.routes.js';
import flightRouter from '../modules/flights/flight.routes.js';
import seatRouter from '../modules/seats/seat.routes.js';
import bookingRouter from '../modules/bookings/booking.routes.js';
import paymentRouter from '../modules/payments/payment.routes.js';
import discountRouter from '../modules/discounts/discount.routes.js';
import baggageRouter from '../modules/baggage/baggage.routes.js';
import mealRouter from '../modules/meals/meal.routes.js';
import reviewRouter from '../modules/reviews/review.routes.js';
import notificationRouter from '../modules/notifications/notification.routes.js';
import airlineRouter from '../modules/airlines/airline.routes.js';
import airportRouter from '../modules/airports/airport.routes.js';
import aircraftRouter from '../modules/aircrafts/aircraft.routes.js';
import passengerRouter from '../modules/passengers/passenger.routes.js';
import adminRouter from '../modules/admin/admin.routes.js';

const router = Router();

// Register routers
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/flights', flightRouter);
router.use('/seats', seatRouter);
router.use('/bookings', bookingRouter);
router.use('/payments', paymentRouter);
router.use('/discounts', discountRouter);
router.use('/baggage', baggageRouter);
router.use('/meals', mealRouter);
router.use('/reviews', reviewRouter);
router.use('/notifications', notificationRouter);
router.use('/airlines', airlineRouter);
router.use('/airports', airportRouter);
router.use('/aircrafts', aircraftRouter);
router.use('/passengers', passengerRouter);
router.use('/admin', adminRouter);

export default router;
