import * as queries from './flight.queries.js';

export const searchFlights = async (searchParams) => {
  const originId = await queries.getAirportIdByCodeOrId(searchParams.origin);
  const destinationId = await queries.getAirportIdByCodeOrId(searchParams.destination);

  if (!originId || !destinationId) {
    return [];
  }

  return await queries.searchFlights({
    originId,
    destinationId,
    departureDate: searchParams.departure_date,
    passengers: searchParams.passengers
  });
};

export const getFlightById = async (id) => {
  const flight = await queries.getFlightById(id);
  if (!flight) {
    const error = new Error('Flight not found');
    error.status = 404;
    throw error;
  }
  return flight;
};
