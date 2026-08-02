import * as seatQueries from './seat.queries.js';

export const getSeatsByFlight = async (flightId) => {
  return seatQueries.findByFlightId(flightId);
};
