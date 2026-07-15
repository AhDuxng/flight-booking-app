import { randomUUID } from 'node:crypto';
import * as bookingQueries from '../bookings/booking.queries.js';
import * as notificationService from '../notifications/notification.service.js';
import * as paymentQueries from './payment.queries.js';
import { createHttpError } from '../../utils/error.js';
import { bumpCacheVersion } from '../../config/cache.js';

export const createPaymentIntent = async (userId, payload) => {
  const booking = await bookingQueries.findBasicMineById(payload.bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }

  if (booking.status !== 'pending') {
    throw createHttpError(400, 'Booking is not awaiting payment');
  }

  if (!booking.hold_expires_at || new Date(booking.hold_expires_at) <= new Date()) {
    throw createHttpError(409, 'Seat hold has expired. Please create a new booking');
  }

  const existingIntent = await paymentQueries.findPendingByBookingId(booking.id);

  if (existingIntent) {
    return existingIntent;
  }

  return paymentQueries.insertIntent({
    booking_id: booking.id,
    amount: booking.total_price,
    provider: payload.provider,
    transaction_ref: `payment_${randomUUID()}`,
    status: 'pending',
  });
};

export const getPaymentsByBooking = async (userId, bookingId) => {
  const booking = await bookingQueries.findBasicMineById(bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }

  return paymentQueries.findByBookingId(bookingId);
};

export const getPaymentStatus = async (userId, payload) => {
  const booking = await bookingQueries.findBasicMineById(payload.bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }

  const payment = await paymentQueries.findByReference(payload.bookingId, payload.transactionRef);

  if (!payment) {
    throw createHttpError(404, 'Payment not found');
  }

  return payment;
};

export const handleWebhook = async (payload) => {
  // Bài toán 3 - Distributed Transaction: write-ahead log giúp callback có thể retry idempotent sau lỗi giữa các service.
  const webhookLog = await paymentQueries.insertWebhookLog(payload);

  let result;

  try {
    result = await paymentQueries.processWebhook(payload);
    await paymentQueries.updateWebhookLog(webhookLog.id, result);
  } catch (error) {
    await paymentQueries.updateWebhookLog(webhookLog.id, null, error.message).catch(() => {});
    throw error;
  }

  // Bài toán 1 - Seat Inventory & Concurrency: webhook có thể confirm hoặc release ghế, nên cache phải bị vô hiệu sau commit.
  await bumpCacheVersion('flight-search');

  if (result?.processed && result.payment_status === 'success') {
    await notificationService.sendNotification(result.user_id, {
      type: 'payment_success',
      title: 'Payment successful',
      body: `Your booking ${result.booking_id} has been confirmed`,
      payload: { bookingId: result.booking_id, paymentId: result.payment_id },
    });
  }

  if (result?.processed && result.payment_status === 'failed') {
    await notificationService.sendNotification(result.user_id, {
      type: 'payment_failed',
      title: 'Payment failed',
      body: `Payment for booking ${result.booking_id} failed`,
      payload: { bookingId: result.booking_id, paymentId: result.payment_id },
    });
  }

  if (result?.requires_refund) {
    await notificationService.sendNotification(result.user_id, {
      type: 'general',
      title: 'Payment requires refund review',
      body: `Payment for booking ${result.booking_id} arrived after the seat hold expired.`,
      payload: { bookingId: result.booking_id, paymentId: result.payment_id, requiresRefund: true },
    });
  }

  return result;
};
