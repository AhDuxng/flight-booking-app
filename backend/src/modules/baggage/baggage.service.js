import baggageQueries from './baggage.queries.js';

export const getBaggageByFlightService = async (flightId) => {
  return await baggageQueries.getBaggageByFlightId(flightId);
};

export const getBaggageByIdService = async (id) => {
  const baggage = await baggageQueries.getBaggageById(id);
  if (!baggage) {
    const error = new Error('Không tìm thấy thông tin gói hành lý.');
    error.statusCode = 404;
    throw error;
  }
  return baggage;
};

export const createBaggageService = async (data) => {
  return await baggageQueries.createBaggage(data);
};

export const updateBaggageService = async (id, updates) => {
  await getBaggageByIdService(id);
  return await baggageQueries.updateBaggage(id, updates);
};

export const deleteBaggageService = async (id) => {
  await getBaggageByIdService(id);
  return await baggageQueries.deleteBaggage(id);
};

export default {
  getBaggageByFlightService,
  getBaggageByIdService,
  createBaggageService,
  updateBaggageService,
  deleteBaggageService,
};
