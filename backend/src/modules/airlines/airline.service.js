import airlineQueries from './airline.queries.js';

export const getAirlinesService = async (activeOnly = false) => {
  return await airlineQueries.getAllAirlines(activeOnly);
};

export const getAirlineByIdService = async (id) => {
  const airline = await airlineQueries.getAirlineById(id);
  if (!airline) {
    const error = new Error('Không tìm thấy thông tin hãng hàng không.');
    error.statusCode = 404;
    throw error;
  }
  return airline;
};

export const createAirlineService = async (data) => {
  const existing = await airlineQueries.getAirlineByCode(data.code);
  if (existing) {
    const error = new Error('Mã hãng hàng không (code) này đã tồn tại.');
    error.statusCode = 400;
    throw error;
  }
  return await airlineQueries.createAirline(data);
};

export const updateAirlineService = async (id, updates) => {
  await getAirlineByIdService(id);
  if (updates.code) {
    const existing = await airlineQueries.getAirlineByCode(updates.code);
    if (existing && existing.id !== id) {
      const error = new Error('Mã hãng hàng không (code) này đã bị sử dụng.');
      error.statusCode = 400;
      throw error;
    }
  }
  return await airlineQueries.updateAirline(id, updates);
};

export const deleteAirlineService = async (id) => {
  await getAirlineByIdService(id);
  return await airlineQueries.deleteAirline(id);
};

export default {
  getAirlinesService,
  getAirlineByIdService,
  createAirlineService,
  updateAirlineService,
  deleteAirlineService,
};
