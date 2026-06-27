import * as queries from './passenger.queries.js';

export const getPassengerById = async (userId, userRole, id) => {
  const passenger = await queries.getPassengerById(id);
  if (!passenger) {
    const error = new Error('Passenger not found');
    error.status = 404;
    throw error;
  }

  // Authorize check: passenger must belong to a booking owned by user (unless admin)
  if (userRole !== 'admin' && passenger.booking?.user_id !== userId) {
    const error = new Error('Forbidden: Access denied to this passenger record');
    error.status = 403;
    throw error;
  }

  return passenger;
};
