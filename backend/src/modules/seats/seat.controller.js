import * as seatService from './seat.service.js';

export const getSeatsByFlight = async (req, res, next) => {
  try {
    const data = await seatService.getSeatsByFlight(req.query.flightId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
