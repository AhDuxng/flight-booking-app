import * as airportQueries from './airport.queries.js';
import { createHttpError } from '../../utils/error.js';

export const getAllAirports = async () => {
  return airportQueries.findAll();
};

export const getAirportByCode = async (code) => {
  const airport = await airportQueries.findByCode(code);

  if (!airport) {
    throw createHttpError(404, 'Airport not found');
  }

  return airport;
};

export const createAirport = async (payload) => {
  const existing = await airportQueries.findByCode(payload.code);

  if (existing) {
    throw createHttpError(409, 'Airport code already exists');
  }

  return airportQueries.insert({
    code: payload.code,
    name: payload.name,
    city: payload.city,
    country: payload.country,
    timezone: payload.timezone,
  });
};

export const updateAirport = async (airportId, payload) => {
  const airport = await airportQueries.findById(airportId);

  if (!airport) {
    throw createHttpError(404, 'Airport not found');
  }

  if (payload.code && payload.code !== airport.code) {
    const existing = await airportQueries.findByCode(payload.code);
    if (existing) {
      throw createHttpError(409, 'Airport code already exists');
    }
  }

  return airportQueries.update(airportId, payload);
};
