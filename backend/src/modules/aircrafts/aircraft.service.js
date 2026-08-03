import * as aircraftQueries from './aircraft.queries.js';
import { createHttpError } from '../../utils/error.js';

export const getAllAircrafts = async () => {
  return aircraftQueries.findAll();
};

export const createAircraft = async (payload) => {
  const existing = await aircraftQueries.findByCode(payload.code);

  if (existing) {
    throw createHttpError(409, 'Aircraft code already exists');
  }

  return aircraftQueries.insert({
    airline_id: payload.airlineId,
    code: payload.code,
    model: payload.model,
    total_seats: payload.totalSeats,
  });
};

export const updateAircraft = async (aircraftId, payload) => {
  const aircraft = await aircraftQueries.findById(aircraftId);

  if (!aircraft) {
    throw createHttpError(404, 'Aircraft not found');
  }

  if (payload.code && payload.code !== aircraft.code) {
    const existing = await aircraftQueries.findByCode(payload.code);
    if (existing) {
      throw createHttpError(409, 'Aircraft code already exists');
    }
  }

  return aircraftQueries.update(aircraftId, {
    ...(payload.airlineId && { airline_id: payload.airlineId }),
    ...(payload.code && { code: payload.code }),
    ...(payload.model && { model: payload.model }),
    ...(payload.totalSeats && { total_seats: payload.totalSeats }),
  });
};
