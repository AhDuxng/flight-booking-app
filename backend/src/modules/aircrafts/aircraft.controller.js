import * as aircraftService from './aircraft.service.js';

export const getAllAircrafts = async (req, res, next) => {
  try {
    const data = await aircraftService.getAllAircrafts();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const createAircraft = async (req, res, next) => {
  try {
    const data = await aircraftService.createAircraft(req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const updateAircraft = async (req, res, next) => {
  try {
    const data = await aircraftService.updateAircraft(req.params.aircraftId, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
