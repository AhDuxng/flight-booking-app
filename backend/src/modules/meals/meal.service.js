import * as mealQueries from './meal.queries.js';

export const getMealOptions = async (flightId) => {
  return mealQueries.findByFlightId(flightId);
};
