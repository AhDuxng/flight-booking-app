import * as queries from './meal.queries.js';

export const getMealOptionsByFlightId = async (flightId) => {
  return await queries.getMealOptionsByFlightId(flightId);
};
