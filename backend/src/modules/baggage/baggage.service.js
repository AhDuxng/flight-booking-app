import * as baggageQueries from './baggage.queries.js';

export const getBaggageOptions = async (flightId) => {
  return baggageQueries.findByFlightId(flightId);
};
