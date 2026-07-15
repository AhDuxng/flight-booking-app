import * as seatQueries from './seat.queries.js';
import { createHttpError } from '../../utils/error.js';
import { bumpCacheVersion } from '../../config/cache.js';

export const getSeatsByFlight = async (flightId) => {
  return seatQueries.findByFlightId(flightId);
};

export const holdSeat = async (userId, { bookingId, seatId }) => {
  const [booking, seat] = await Promise.all([
    seatQueries.findOwnedBooking(bookingId, userId),
    seatQueries.findById(seatId),
  ]);

  if (!booking || booking.status !== 'pending') {
    throw createHttpError(400, 'Booking is not available for seat selection');
  }

  if (!seat || seat.flight_id !== booking.flight_id) {
    throw createHttpError(400, 'Seat does not belong to this flight');
  }

  await seatQueries.hold(seatId, bookingId);

  // Bài toán 1 - Seat Inventory & Concurrency: RPC đã lock seat trong Postgres; cache chỉ được làm mới sau khi RPC commit.
  await bumpCacheVersion('flight-search');
};

export const releaseSeat = async (userId, seatId) => {
  const seat = await seatQueries.findById(seatId);

  if (!seat?.booking_id) {
    throw createHttpError(404, 'Held seat not found');
  }

  const booking = await seatQueries.findOwnedBooking(seat.booking_id, userId);

  if (!booking || seat.status !== 'held') {
    throw createHttpError(404, 'Held seat not found');
  }

  await seatQueries.release(seatId, booking.id);

  // Bài toán 1 - Seat Inventory & Concurrency: trả ghế về tồn kho và vô hiệu cache kết quả tìm kiếm.
  await bumpCacheVersion('flight-search');
};
