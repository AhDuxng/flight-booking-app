import * as flightQueries from './flight.queries.js';
import { createHttpError } from '../../utils/error.js';
import { createPagination, getPagination } from '../../utils/pagination.js';
import { bumpCacheVersion, getCachedJson, getCacheVersion, setCachedJson } from '../../config/cache.js';
import { env } from '../../config/env.js';

const getDynamicPriceMultiplier = (availableSeats, totalSeats) => {
  if (!totalSeats || availableSeats / totalSeats > 0.5) {
    return 1;
  }

  if (availableSeats / totalSeats > 0.25) {
    return 1.1;
  }

  if (availableSeats / totalSeats > 0.1) {
    return 1.2;
  }

  return 1.35;
};

// Bài toán 2 - Flight Search & Caching: giá hiển thị thay đổi theo tỷ lệ ghế còn, giá chốt vẫn được tính trong transaction booking.
const addDynamicPrice = (flight) => {
  const multiplier = getDynamicPriceMultiplier(
    Number(flight.available_seats),
    Number(flight.aircraft?.total_seats),
  );

  return {
    ...flight,
    dynamic_price: Math.round(Number(flight.base_price) * multiplier),
    dynamic_price_multiplier: multiplier,
  };
};

// Bài toán 2 - Flight Search & Caching: dùng versioned cache key để invalidation O(1) khi tồn ghế thay đổi.
const buildSearchCacheKey = (filters, version) => {
  const normalizedFilters = {
    airlineId: filters.airlineId ?? null,
    departureDate: filters.departureDate ?? null,
    destinationAirportId: filters.destinationAirportId ?? null,
    limit: filters.limit,
    originAirportId: filters.originAirportId ?? null,
    page: filters.page,
    status: filters.status ?? null,
  };

  return `flight-search:${version}:${Buffer.from(JSON.stringify(normalizedFilters)).toString('base64url')}`;
};

const assertFlightTimes = (payload, currentFlight = null) => {
  const departureTime = payload.departureTime ?? currentFlight?.departure_time;
  const arrivalTime = payload.arrivalTime ?? currentFlight?.arrival_time;

  if (departureTime && arrivalTime && new Date(arrivalTime) <= new Date(departureTime)) {
    throw createHttpError(400, 'Arrival must be after departure');
  }
};

const toFlightPayload = (payload) => {
  return {
    ...(payload.airlineId !== undefined && { airline_id: payload.airlineId }),
    ...(payload.aircraftId !== undefined && { aircraft_id: payload.aircraftId }),
    ...(payload.originAirportId !== undefined && { origin_airport_id: payload.originAirportId }),
    ...(payload.destinationAirportId !== undefined && { destination_airport_id: payload.destinationAirportId }),
    ...(payload.flightNumber !== undefined && { flight_number: payload.flightNumber }),
    ...(payload.departureTime !== undefined && { departure_time: payload.departureTime }),
    ...(payload.arrivalTime !== undefined && { arrival_time: payload.arrivalTime }),
    ...(payload.basePrice !== undefined && { base_price: payload.basePrice }),
    ...(payload.status !== undefined && { status: payload.status }),
  };
};

export const searchFlights = async (filters) => {
  const { page, limit, from, to } = getPagination(filters);
  const cacheVersion = await getCacheVersion('flight-search');
  const cacheKey = buildSearchCacheKey({ ...filters, page, limit }, cacheVersion);
  const cachedResult = await getCachedJson(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const { data, count } = await flightQueries.search(filters, from, to);

  const result = {
    data: data.map(addDynamicPrice),
    pagination: createPagination(page, limit, count),
  };

  await setCachedJson(cacheKey, result, env.flightSearchCacheTtlSeconds);
  return result;
};

export const getFlightById = async (flightId) => {
  const flight = await flightQueries.findById(flightId);

  if (!flight) {
    throw createHttpError(404, 'Flight not found');
  }

  return addDynamicPrice(flight);
};

export const getFlightSeats = async (flightId) => {
  await getFlightById(flightId);
  return flightQueries.findSeatsByFlightId(flightId);
};

export const createFlight = async (payload) => {
  const flightId = await flightQueries.createWithSeats({
    ...toFlightPayload(payload),
    seats: payload.seats ?? [],
  });

  await bumpCacheVersion('flight-search');
  return getFlightById(flightId);
};

export const updateFlight = async (flightId, payload) => {
  const currentFlight = await flightQueries.findBasicById(flightId);

  if (!currentFlight) {
    throw createHttpError(404, 'Flight not found');
  }

  const originAirportId = payload.originAirportId ?? currentFlight.origin_airport_id;
  const destinationAirportId = payload.destinationAirportId ?? currentFlight.destination_airport_id;

  if (originAirportId === destinationAirportId) {
    throw createHttpError(400, 'Origin and destination must differ');
  }

  assertFlightTimes(payload, currentFlight);
  const flight = await flightQueries.update(flightId, toFlightPayload(payload));
  await bumpCacheVersion('flight-search');
  return flight;
};
