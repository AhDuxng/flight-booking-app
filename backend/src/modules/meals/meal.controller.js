import * as mealService from './meal.service.js';

export const getMealOptions = async (req, res, next) => {
  try {
    const data = await mealService.getMealOptions(req.query.flightId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
