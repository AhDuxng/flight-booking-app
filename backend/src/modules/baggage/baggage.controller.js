import * as service from './baggage.service.js';

export const getBaggageOptions = async (req, res, next) => {
  try {
    const { flight_id } = req.query;
    const options = await service.getBaggageOptionsByFlightId(flight_id);
    return res.status(200).json({
      message: 'Baggage options retrieved successfully',
      data: options
    });
  } catch (error) {
    next(error);
  }
};
