import * as queries from './baggage.queries.js';

export const getBaggageOptionsByFlightId = async (flightId) => {
  return await queries.getBaggageOptionsByFlightId(flightId);
};
