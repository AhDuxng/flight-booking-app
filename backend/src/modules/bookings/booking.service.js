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

export const createBooking = async (userId, payload, rawIdempotencyKey) => {
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
  const requestHash = hashRequest(payload);
  return withRedisLocks(payload.seatIds, async () => {
    try {
      const bookingId = await bookingQueries.createAtomically(userId, payload, idempotencyKey, requestHash);
      const booking = await getMyBookingById(bookingId, userId);

      await bumpCacheVersion('flight-search');
      logger.info('booking_created', { booking_id: booking.id, user_id: userId });
      return booking;
    } catch (error) {
      logger.warn('booking_creation_failed', { user_id: userId, error_code: error.code, error: error.message });
      throw error;
    }
  });
};

export const cancelBooking = async (bookingId, userId) => {
  const booking = await bookingQueries.findBasicMineById(bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }
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

  await bookingQueries.cancelAtomically(bookingId, userId);
  const cancelledBooking = await getMyBookingById(bookingId, userId);

  // Bài toán 3 - Distributed Transaction: huỷ booking là bước bù trừ, trả lại tồn ghế và làm mới dữ liệu tìm kiếm.
  await bumpCacheVersion('flight-search');

  return cancelledBooking;
};
