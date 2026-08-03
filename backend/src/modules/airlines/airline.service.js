import * as airlineQueries from './airline.queries.js';
import { createHttpError } from '../../utils/error.js';

export const createAirline = async (payload) => {
  const existing = await airlineQueries.findByCode(payload.code);

  if (existing) {
    throw createHttpError(409, 'Airline code already exists');
  }

  return airlineQueries.insert({
    code: payload.code,
    name: payload.name,
    logo_url: payload.logoUrl ?? null,
    country: payload.country ?? null,
    is_active: payload.isActive,
  });
};

export const getAllAirlines = async () => {
  return airlineQueries.findAll();
};

export const updateAirline = async (airlineId, payload) => {
  const airline = await airlineQueries.findById(airlineId);

  if (!airline) {
    throw createHttpError(404, 'Airline not found');
  }

  if (payload.code && payload.code !== airline.code) {
    const existing = await airlineQueries.findByCode(payload.code);
    if (existing) {
      throw createHttpError(409, 'Airline code already exists');
    }
  }

  return airlineQueries.update(airlineId, {
    ...(payload.code && { code: payload.code }),
    ...(payload.name && { name: payload.name }),
    ...(payload.logoUrl !== undefined && { logo_url: payload.logoUrl }),
    ...(payload.country !== undefined && { country: payload.country }),
    ...(payload.isActive !== undefined && { is_active: payload.isActive }),
  });
};
