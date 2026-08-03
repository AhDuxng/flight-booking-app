import * as baggageService from './baggage.service.js';

export const getBaggageOptions = async (req, res, next) => {
  try {
    const data = await baggageService.getBaggageOptions(req.query.flightId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
