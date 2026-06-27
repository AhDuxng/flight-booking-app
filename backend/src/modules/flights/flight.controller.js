import * as service from './flight.service.js';

export const searchFlights = async (req, res, next) => {
  try {
    const flights = await service.searchFlights(req.query);
    return res.status(200).json({
      message: 'Flights retrieved successfully',
      data: flights
    });
  } catch (error) {
    next(error);
  }
};

export const getFlightById = async (req, res, next) => {
  try {
    const flight = await service.getFlightById(req.params.id);
    return res.status(200).json({
      message: 'Flight retrieved successfully',
      data: flight
    });
  } catch (error) {
    next(error);
  }
};
