import * as queries from './airline.queries.js';

export const getAirlines = async () => {
  return await queries.getAirlines();
};

export const getAirlineById = async (id) => {
  const airline = await queries.getAirlineById(id);
  if (!airline) {
    const error = new Error('Airline not found');
    error.status = 404;
    throw error;
  }
  return airline;
};

export const createAirline = async (airlineData) => {
  return await queries.createAirline(airlineData);
};

export const updateAirline = async (id, airlineData) => {
  await getAirlineById(id);
  return await queries.updateAirline(id, airlineData);
};

export const deleteAirline = async (id) => {
  await getAirlineById(id);
  return await queries.deleteAirline(id);
};
