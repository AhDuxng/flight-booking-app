import * as service from './airline.service.js';

export const getAirlines = async (req, res, next) => {
  try {
    const airlines = await service.getAirlines();
    return res.status(200).json({
      message: 'Airlines retrieved successfully',
      data: airlines
    });
  } catch (error) {
    next(error);
  }
};

export const getAirlineById = async (req, res, next) => {
  try {
    const airline = await service.getAirlineById(req.params.id);
    return res.status(200).json({
      message: 'Airline retrieved successfully',
      data: airline
    });
  } catch (error) {
    next(error);
  }
};

export const createAirline = async (req, res, next) => {
  try {
    const airline = await service.createAirline(req.body);
    return res.status(201).json({
      message: 'Airline created successfully',
      data: airline
    });
  } catch (error) {
    next(error);
  }
};

export const updateAirline = async (req, res, next) => {
  try {
    const airline = await service.updateAirline(req.params.id, req.body);
    return res.status(200).json({
      message: 'Airline updated successfully',
      data: airline
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAirline = async (req, res, next) => {
  try {
    const airline = await service.deleteAirline(req.params.id);
    return res.status(200).json({
      message: 'Airline deleted successfully',
      data: airline
    });
  } catch (error) {
    next(error);
  }
};
