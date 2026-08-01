import { randomUUID } from 'node:crypto';
import * as bookingQueries from '../bookings/booking.queries.js';
import * as notificationService from '../notifications/notification.service.js';
import * as paymentQueries from './payment.queries.js';
import { createHttpError } from '../../utils/error.js';
import { bumpCacheVersion } from '../../config/cache.js';
import { env } from '../../config/env.js';
import * as operationQueries from '../operations/operation.queries.js';
import { createETicketPdf } from '../operations/document.service.js';
import { sendTicketEmail } from '../operations/mail.service.js';

const supportedProviders = [...new Set(['cash', ...(env.paymentCheckoutApiUrl && env.paymentSecretKey ? env.paymentProviders : [])])].filter((provider) =>
  ['vnpay', 'momo', 'stripe', 'cash'].includes(provider),
);

export const getPaymentConfig = () => ({ providers: supportedProviders });

export const attachOnlineCheckout = async (payment, booking) => {
  if (payment.provider === 'cash') return payment;
  const response = await fetch(env.paymentCheckoutApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.paymentSecretKey}` },
    body: JSON.stringify({
      provider: payment.provider,
      bookingId: booking.id,
      transactionRef: payment.transaction_ref,
      amount: Number(payment.amount),
      currency: payment.currency,
      returnUrl: env.paymentReturnUrl,
      cancelUrl: env.paymentCancelUrl,
      webhookUrl: env.backendPublicUrl ? `${env.backendPublicUrl.replace(/\/$/, '')}/api/payments/webhook` : undefined,
    }),
  });
  if (!response.ok) throw createHttpError(502, 'Unable to create provider checkout');
  const data = await response.json();
  const checkoutUrl = data.checkoutUrl ?? data.checkout_url ?? data.payUrl;
  if (!checkoutUrl || !URL.canParse(checkoutUrl)) throw createHttpError(502, 'Payment provider returned an invalid checkout URL');
  return paymentQueries.attachCheckout(payment.id, checkoutUrl, data);
};

export const createPaymentIntent = async (userId, payload) => {
  if (!supportedProviders.includes(payload.provider)) {
    throw createHttpError(400, 'Payment provider is not configured');
  }
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

  const payment = await paymentQueries.insertIntent({
    booking_id: booking.id,
    amount: booking.total_price,
    provider: payload.provider,
    transaction_ref: `payment_${randomUUID()}`,
    status: 'pending',
  });
  try {
    return await attachOnlineCheckout(payment, booking);
  } catch (error) {
    await paymentQueries.failIntent(payment.id, error.message).catch(() => {});
    throw error;
  }
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
    const intent = await paymentQueries.findByTransactionReference(payload.transactionRef);
    result = intent?.purpose === 'flight_change'
      ? await paymentQueries.processChangeWebhook(payload)
      : await paymentQueries.processWebhook(payload);
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
      title: result.purpose === 'flight_change' ? 'Flight changed successfully' : 'Payment successful',
      body: result.purpose === 'flight_change'
        ? `Your new itinerary for booking ${result.booking_id} is confirmed`
        : `Your booking ${result.booking_id} has been confirmed and tickets are ready`,
      payload: { bookingId: result.booking_id, paymentId: result.payment_id, purpose: result.purpose ?? 'booking' },
    });

    // Payment/change confirmation is already committed. Email delivery is deliberately
    // best-effort so an SMTP outage never rolls back a paid booking.
    try {
      const booking = await operationQueries.findBooking(result.booking_id, result.user_id);
      if (booking?.tickets?.length) {
        await sendTicketEmail({ booking, pdf: await createETicketPdf(booking) });
      }
    } catch (error) {
      if (env.nodeEnv !== 'test') console.error('Unable to send e-ticket email', error);
    }
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
