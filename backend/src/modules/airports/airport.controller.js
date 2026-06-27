import * as service from './airport.service.js';

export const getAirports = async (req, res, next) => {
  try {
    const airports = await service.getAirports();
    return res.status(200).json({
      message: 'Airports retrieved successfully',
      data: airports
    });
  } catch (error) {
    next(error);
  }
};

export const getAirportById = async (req, res, next) => {
  try {
    const airport = await service.getAirportById(req.params.id);
    return res.status(200).json({
      message: 'Airport retrieved successfully',
      data: airport
    });
  } catch (error) {
    next(error);
  }
};

export const createAirport = async (req, res, next) => {
  try {
    const airport = await service.createAirport(req.body);
    return res.status(201).json({
      message: 'Airport created successfully',
      data: airport
    });
  } catch (error) {
    next(error);
  }
};

export const updateAirport = async (req, res, next) => {
  try {
    const airport = await service.updateAirport(req.params.id, req.body);
    return res.status(200).json({
      message: 'Airport updated successfully',
      data: airport
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAirport = async (req, res, next) => {
  try {
    const airport = await service.deleteAirport(req.params.id);
    return res.status(200).json({
      message: 'Airport deleted successfully',
      data: airport
    });
  } catch (error) {
    next(error);
  }
};
