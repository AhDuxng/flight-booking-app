import * as bookingQueries from './booking.queries.js';
import * as notificationService from '../notifications/notification.service.js';
import { createHttpError } from '../../utils/error.js';
import { createPagination, getPagination } from '../../utils/pagination.js';
import { bumpCacheVersion, withRedisLocks } from '../../config/cache.js';

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

export const createBooking = async (userId, payload) => {
  return withRedisLocks(payload.seatIds, async () => {
    const bookingId = await bookingQueries.createAtomically(userId, payload);
    const booking = await getMyBookingById(bookingId, userId);

    // Bài toán 1 - Seat Inventory & Concurrency: booking transaction đã giữ ghế thành công, nên vô hiệu cache tìm kiếm ngay sau commit.
    await bumpCacheVersion('flight-search');

    await notificationService.sendNotification(userId, {
      type: 'general',
      title: 'Booking created',
      body: `Your booking ${booking.id} is awaiting payment`,
      payload: { bookingId: booking.id },
    });

    return booking;
  });
};

export const cancelBooking = async (bookingId, userId) => {
  const booking = await bookingQueries.findBasicMineById(bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }
  if (!['pending', 'paid', 'confirmed'].includes(booking.status)) {
    throw createHttpError(409, 'Booking cannot be cancelled in its current status');
  }
  if (!booking.flight || new Date(booking.flight.departure_time) <= new Date()
    || ['boarding', 'departed', 'arrived', 'cancelled'].includes(booking.flight.status)) {
    throw createHttpError(409, 'Flight is no longer eligible for cancellation');
  }

  await bookingQueries.cancelAtomically(bookingId, userId);
  const cancelledBooking = await getMyBookingById(bookingId, userId);

  // Bài toán 3 - Distributed Transaction: huỷ booking là bước bù trừ, trả lại tồn ghế và làm mới dữ liệu tìm kiếm.
  await bumpCacheVersion('flight-search');

  await notificationService.sendNotification(userId, {
    type: cancelledBooking.status === 'refund_pending' ? 'general' : 'booking_cancelled',
    title: cancelledBooking.status === 'refund_pending' ? 'Refund requested' : 'Booking cancelled',
    body: cancelledBooking.status === 'refund_pending'
      ? `Your booking ${bookingId} was cancelled and is awaiting a refund`
      : `Your booking ${bookingId} has been cancelled`,
    payload: { bookingId },
  });

  return cancelledBooking;
};
