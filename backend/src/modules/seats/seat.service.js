import * as queries from './seat.queries.js';

export const getSeatsByFlightId = async (flightId) => {
  return await queries.getSeatsByFlightId(flightId);
};

export const holdSeat = async (seatId, bookingId) => {
  return await queries.holdSeat(seatId, bookingId);
};
