import * as queries from './airport.queries.js';

export const getAirports = async () => {
  return await queries.getAirports();
};

export const getAirportById = async (id) => {
  const airport = await queries.getAirportById(id);
  if (!airport) {
    const error = new Error('Airport not found');
    error.status = 404;
    throw error;
  }
  return airport;
};

export const createAirport = async (airportData) => {
  return await queries.createAirport(airportData);
};

export const updateAirport = async (id, airportData) => {
  await getAirportById(id);
  return await queries.updateAirport(id, airportData);
};

export const deleteAirport = async (id) => {
  await getAirportById(id);
  return await queries.deleteAirport(id);
};
