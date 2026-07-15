import * as passengerQueries from './passenger.queries.js';
import { createHttpError } from '../../utils/error.js';

export const getPassengersByBooking = async (bookingId, userId) => {
  const booking = await passengerQueries.findOwnedBooking(bookingId, userId);

  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }

  return passengerQueries.findByBookingId(bookingId);
};
