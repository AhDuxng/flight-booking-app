import * as service from './aircraft.service.js';

export const getAircrafts = async (req, res, next) => {
  try {
    const aircrafts = await service.getAircrafts();
    return res.status(200).json({
      message: 'Aircrafts retrieved successfully',
      data: aircrafts
    });
  } catch (error) {
    next(error);
  }
};

export const getAircraftById = async (req, res, next) => {
  try {
    const aircraft = await service.getAircraftById(req.params.id);
    return res.status(200).json({
      message: 'Aircraft retrieved successfully',
      data: aircraft
    });
  } catch (error) {
    next(error);
  }
};

export const createAircraft = async (req, res, next) => {
  try {
    const aircraft = await service.createAircraft(req.body);
    return res.status(201).json({
      message: 'Aircraft created successfully',
      data: aircraft
    });
  } catch (error) {
    next(error);
  }
};

export const updateAircraft = async (req, res, next) => {
  try {
    const aircraft = await service.updateAircraft(req.params.id, req.body);
    return res.status(200).json({
      message: 'Aircraft updated successfully',
      data: aircraft
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAircraft = async (req, res, next) => {
  try {
    const aircraft = await service.deleteAircraft(req.params.id);
    return res.status(200).json({
      message: 'Aircraft deleted successfully',
      data: aircraft
    });
  } catch (error) {
    next(error);
  }
};
