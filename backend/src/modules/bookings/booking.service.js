import * as bookingQueries from './booking.queries.js';
import { createHttpError } from '../../utils/error.js';
import { createPagination, getPagination } from '../../utils/pagination.js';
import { bumpCacheVersion, withRedisLocks } from '../../config/cache.js';
import { hashRequest, normalizeIdempotencyKey } from '../../utils/idempotency.js';
import { logger } from '../../utils/logger.js';

export const getMyBookings = async (userId, query) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await bookingQueries.findMine(userId, query.status, from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const getMyBookingById = async (bookingId, userId) => {
  const booking = await bookingQueries.findMineById(bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }

  return booking;
};

const assertCancellable = (booking) => {
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw createHttpError(409, 'Booking cannot be cancelled in its current status');
  }
  if (
    !booking.flight ||
    new Date(booking.flight.departure_time) <= new Date() ||
    ['boarding', 'departed', 'arrived', 'cancelled'].includes(booking.flight.status)
  ) {
    throw createHttpError(409, 'Flight is no longer eligible for cancellation');
  }
};

export const getCancellationQuote = async (bookingId, userId) => {
  const booking = await getMyBookingById(bookingId, userId);
  assertCancellable(booking);

  const payments = (booking.payments ?? []).filter(
    (item) => ['booking', 'flight_change'].includes(item.purpose) && item.status === 'success',
  );
  const paidAmount = payments.reduce(
    (total, payment) => total + Number(payment.amount_snapshot ?? payment.amount ?? 0),
    0,
  );
  const previousRefund = (booking.refund_requests ?? [])
    .filter((item) => !['rejected', 'failed'].includes(item.status))
    .reduce((total, item) => total + Number(item.approved_amount ?? item.requested_amount ?? 0), 0);
  const refundable = Boolean(booking.fare?.refundable);
  const cancellationFee =
    payments.length && refundable ? Number(booking.fare?.cancellation_fee ?? 0) : 0;
  const remainingPaidBalance = Math.max(0, paidAmount - previousRefund);
  const refundAmount =
    payments.length && refundable ? Math.max(0, remainingPaidBalance - cancellationFee) : 0;
  const refundMethods = [...new Set(payments.map((payment) => payment.provider))];

  return {
    bookingId: booking.id,
    currency: payments[0]?.currency ?? 'VND',
    paidAmount,
    previousRefund,
    refundable,
    cancellationFee,
    refundAmount,
    retainedAmount: Math.max(0, paidAmount - previousRefund - refundAmount),
    refundMethod:
      refundMethods.length === 1 ? refundMethods[0] : refundMethods.length ? 'multiple' : null,
    refundMethods,
    requiresRefundReview: refundAmount > 0,
  };
};

export const createBooking = async (userId, payload, rawIdempotencyKey) => {
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
  const requestHash = hashRequest(payload);
  return withRedisLocks(payload.seatIds, async () => {
    try {
      const bookingId = await bookingQueries.createAtomically(
        userId,
        payload,
        idempotencyKey,
        requestHash,
      );
      const booking = await getMyBookingById(bookingId, userId);

      await bumpCacheVersion('flight-search');
      logger.info('booking_created', { booking_id: booking.id, user_id: userId });
      return booking;
    } catch (error) {
      logger.warn('booking_creation_failed', {
        user_id: userId,
        error_code: error.code,
        error: error.message,
      });
      throw error;
    }
  });
};

export const cancelBooking = async (bookingId, userId) => {
  const booking = await bookingQueries.findBasicMineById(bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }
  assertCancellable(booking);

  const cancellation = await bookingQueries.cancelAtomically(bookingId, userId);
  const cancelledBooking = await getMyBookingById(bookingId, userId);

  // Bài toán 3 - Distributed Transaction: huỷ booking là bước bù trừ, trả lại tồn ghế và làm mới dữ liệu tìm kiếm.
  await bumpCacheVersion('flight-search');

  return { ...cancelledBooking, cancellation_summary: cancellation };
};
