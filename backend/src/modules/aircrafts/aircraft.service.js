import * as queries from './aircraft.queries.js';

export const getAircrafts = async () => {
  return await queries.getAircrafts();
};

export const getAircraftById = async (id) => {
  const aircraft = await queries.getAircraftById(id);
  if (!aircraft) {
    const error = new Error('Aircraft not found');
    error.status = 404;
    throw error;
  }
  return aircraft;
};

export const createAircraft = async (aircraftData) => {
  return await queries.createAircraft(aircraftData);
};

export const updateAircraft = async (id, aircraftData) => {
  await getAircraftById(id);
  return await queries.updateAircraft(id, aircraftData);
};

export const deleteAircraft = async (id) => {
  await getAircraftById(id);
  return await queries.deleteAircraft(id);
};
