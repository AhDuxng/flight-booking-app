import * as flightService from '../flights/flight.service.js';
import * as adminQueries from './admin.queries.js';
import { createPagination, getPagination } from '../../utils/pagination.js';

const getList = async (query, finder) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await finder(from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const getDashboard = async () => {
  return adminQueries.getDashboard();
};

export const getFlights = async (query) => {
  return getList(query, adminQueries.findFlights);
};

export const getBookings = async (query) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await adminQueries.findBookings(query.status, from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const getPayments = async (query) => {
  return getList(query, adminQueries.findPayments);
};

export const getReviews = async (query) => {
  return getList(query, adminQueries.findReviews);
};

export const getUsers = async (query) => {
  return getList(query, adminQueries.findUsers);
};

export const createFlight = async (adminId, payload) => {
  const flight = await flightService.createFlight(payload);
  await adminQueries.logAction({
    admin_id: adminId,
    action: 'create_flight',
    target_id: flight.id,
    target_type: 'flight',
    metadata: { flight_number: flight.flight_number },
  });
  return flight;
};

export const updateFlight = async (adminId, flightId, payload) => {
  const flight = await flightService.updateFlight(flightId, payload);
  await adminQueries.logAction({
    admin_id: adminId,
    action: 'update_flight',
    target_id: flight.id,
    target_type: 'flight',
    metadata: { fields: Object.keys(payload) },
  });
  return flight;
};
