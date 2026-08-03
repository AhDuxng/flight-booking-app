import * as airlineService from './airline.service.js';

export const createAirline = async (req, res, next) => {
  try {
    const data = await airlineService.createAirline(req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const getAllAirlines = async (req, res, next) => {
  try {
    const data = await airlineService.getAllAirlines();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const updateAirline = async (req, res, next) => {
  try {
    const data = await airlineService.updateAirline(req.params.airlineId, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
