import airportQueries from './airport.queries.js';

export const getAirportsService = async () => {
  return await airportQueries.getAllAirports();
};

export const getAirportByIdService = async (id) => {
  const airport = await airportQueries.getAirportById(id);
  if (!airport) {
    const error = new Error('Không tìm thấy thông tin sân bay.');
    error.statusCode = 404;
    throw error;
  }
  return airport;
};

export const createAirportService = async (data) => {
  const existing = await airportQueries.getAirportByCode(data.code);
  if (existing) {
    const error = new Error('Mã sân bay (IATA code) này đã tồn tại.');
    error.statusCode = 400;
    throw error;
  }
  return await airportQueries.createAirport(data);
};

export const updateAirportService = async (id, updates) => {
  await getAirportByIdService(id);
  if (updates.code) {
    const existing = await airportQueries.getAirportByCode(updates.code);
    if (existing && existing.id !== id) {
      const error = new Error('Mã sân bay (code) này đã bị sử dụng.');
      error.statusCode = 400;
      throw error;
    }
  }
  return await airportQueries.updateAirport(id, updates);
};

export const deleteAirportService = async (id) => {
  await getAirportByIdService(id);
  return await airportQueries.deleteAirport(id);
};

export default {
  getAirportsService,
  getAirportByIdService,
  createAirportService,
  updateAirportService,
  deleteAirportService,
};
