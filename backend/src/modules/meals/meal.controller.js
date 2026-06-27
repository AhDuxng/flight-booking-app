import * as service from './meal.service.js';

export const getMealOptions = async (req, res, next) => {
  try {
    const { flight_id } = req.query;
    const options = await service.getMealOptionsByFlightId(flight_id);
    return res.status(200).json({
      message: 'Meal options retrieved successfully',
      data: options
    });
  } catch (error) {
    next(error);
  }
};
