import * as airportService from './airport.service.js';

export const getAllAirports = async (req, res, next) => {
  try {
    const data = await airportService.getAllAirports();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const findAirportByCode = async (req, res, next) => {
  try {
    const data = await airportService.getAirportByCode(req.params.code);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const createAirport = async (req, res, next) => {
  try {
    const data = await airportService.createAirport(req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const updateAirport = async (req, res, next) => {
  try {
    const data = await airportService.updateAirport(req.params.airportId, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
