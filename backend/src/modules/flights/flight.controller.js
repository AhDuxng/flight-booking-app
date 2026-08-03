import * as flightService from './flight.service.js';

export const searchFlights = async (req, res, next) => {
  try {
    const result = await flightService.searchFlights(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const getFlightById = async (req, res, next) => {
  try {
    const data = await flightService.getFlightById(req.params.flightId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const getFlightSeats = async (req, res, next) => {
  try {
    const data = await flightService.getFlightSeats(req.params.flightId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
