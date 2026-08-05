import { randomUUID } from 'node:crypto';
import * as bookingQueries from '../bookings/booking.queries.js';
import * as paymentQueries from './payment.queries.js';
import { createHttpError } from '../../utils/error.js';
import { bumpCacheVersion } from '../../config/cache.js';
import { env } from '../../config/env.js';
import { hashRequest, normalizeIdempotencyKey } from '../../utils/idempotency.js';
import { logger } from '../../utils/logger.js';
import { buildVnpayPaymentUrl, isVnpayConfigured } from './vnpay.gateway.js';

const vnpayConfig = {
  tmnCode: env.vnpayTmnCode,
  hashSecret: env.vnpayHashSecret,
  payUrl: env.vnpayPayUrl,
  returnUrl: env.vnpayReturnUrl,
};
const genericProviders = env.paymentCheckoutApiUrl && env.paymentSecretKey
  ? env.paymentProviders.filter((provider) => provider !== 'vnpay')
  : [];
const supportedProviders = [
  ...new Set(['cash', ...(isVnpayConfigured(vnpayConfig) && env.paymentProviders.includes('vnpay') ? ['vnpay'] : []), ...genericProviders]),
].filter((provider) => ['vnpay', 'momo', 'stripe', 'cash'].includes(provider));

export const getPaymentConfig = () => ({ providers: supportedProviders });

export const attachOnlineCheckout = async (payment, booking, clientIp) => {
  if (payment.provider === 'cash') return payment;
  if (payment.provider === 'vnpay') {
    const { checkoutUrl, requestPayload } = buildVnpayPaymentUrl({
      payment,
      clientIp,
      config: vnpayConfig,
    });
    return paymentQueries.attachCheckout(payment.id, checkoutUrl, {
      provider: 'vnpay',
      request: requestPayload,
    });
  }
  const response = await fetch(env.paymentCheckoutApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.paymentSecretKey}`,
      'Idempotency-Key': payment.transaction_ref,
    },
    signal: AbortSignal.timeout(env.paymentRequestTimeoutMs),
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

export const createPaymentIntent = async (userId, payload, rawIdempotencyKey, clientIp) => {
  if (!supportedProviders.includes(payload.provider)) {
    throw createHttpError(400, 'Payment provider is not configured');
  }
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey, { required: true });
  const booking = await bookingQueries.findBasicMineById(payload.bookingId, userId);
  if (!booking) throw createHttpError(404, 'Booking not found');
  const payment = await paymentQueries.getOrCreateIntent({
    userId,
    bookingId: payload.bookingId,
    purpose: 'booking',
    provider: payload.provider,
    idempotencyKey,
    requestHash: hashRequest(payload),
    transactionRef:
      payload.provider === 'vnpay'
        ? `VF${randomUUID().replaceAll('-', '')}`
        : `payment_${randomUUID()}`,
  });
  if (payment.checkout_url || payment.provider === 'cash') return payment;
  return attachOnlineCheckout(payment, booking, clientIp);
};

export const expirePaymentIntent = async (userId, paymentId) => {
  await paymentQueries.expireIntent(paymentId, userId);
  return { paymentId, status: 'expired' };
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
  logger.info('payment_webhook_received', {
    provider_event_id: payload.providerEventId,
    transaction_ref: payload.transactionRef,
    provider: payload.provider,
  });
  let result;
  try {
    result = await paymentQueries.processWebhook(payload);
  } catch (error) {
    await paymentQueries.storeFailedWebhook(payload, error.message).catch(() => {});
    logger.warn('payment_webhook_failed', {
      provider_event_id: payload.providerEventId,
      transaction_ref: payload.transactionRef,
      error_code: error.code,
      error: error.message,
    });
    throw error;
  }

  // Bài toán 1 - Seat Inventory & Concurrency: webhook có thể confirm hoặc release ghế, nên cache phải bị vô hiệu sau commit.
  await bumpCacheVersion('flight-search');

  logger.info(result?.duplicate ? 'payment_webhook_replay' : 'payment_webhook_processed', {
    provider_event_id: payload.providerEventId,
    transaction_ref: payload.transactionRef,
    payment_id: result?.payment_id,
    booking_id: result?.booking_id,
    payment_status: result?.payment_status,
    requires_refund: result?.requires_refund,
  });

  return result;
};
