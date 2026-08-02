import { supabase, supabaseRead } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const FLIGHT_COLUMNS = `
  id, airline_id, aircraft_id, origin_airport_id, destination_airport_id,
  flight_number, departure_time, arrival_time, base_price, available_seats,
  status, created_at, updated_at,
  airline:airlines!flights_airline_id_fkey(id, code, name, logo_url),
  aircraft:aircrafts!flights_aircraft_id_fkey(id, code, model, total_seats),
  origin_airport:airports!flights_origin_airport_id_fkey(id, code, name, city, timezone),
  destination_airport:airports!flights_destination_airport_id_fkey(id, code, name, city, timezone)
`;

export const search = async (filters, from, to) => {
  if (filters.status && !['scheduled', 'delayed'].includes(filters.status)) return { data: [], count: 0 };
  let departureFrom = new Date().toISOString();
  let departureTo = null;
  if (filters.departureDate) {
    const start = dayjs
      .tz(filters.departureDate, filters.departureTimezone ?? 'UTC')
      .startOf('day');
    const end = start.add(1, 'day');
    const lowerBound = start.isAfter(dayjs()) ? start : dayjs();
    departureFrom = lowerBound.toISOString();
    departureTo = end.toISOString();
  }

  const { data, error } = await supabaseRead.rpc('search_flights_v2', {
    p_origin_airport_id: filters.originAirportId ?? null,
    p_destination_airport_id: filters.destinationAirportId ?? null,
    p_airline_id: filters.airlineId ?? null,
    p_departure_from: departureFrom,
    p_departure_to: departureTo,
    p_cabin_class: filters.cabinClass ?? null,
    p_passenger_count: filters.passengerCount ?? 1,
    p_flight_number: filters.flightNumber ?? null,
    p_offset: from,
    p_limit: to - from + 1,
  });
  throwDatabaseError(error, 'Unable to load flights');
  return { data: data?.data ?? [], count: Number(data?.count ?? 0) };
};

export const findCalculatedPrice = async (flightId) => {
  const { data, error } = await supabaseRead.rpc('calculate_flight_price', {
    p_flight_id: flightId,
    p_cabin_class: null,
    p_fare_id: null,
  });
  throwDatabaseError(error, 'Unable to calculate flight price');
  return Number(data);
};

export const findById = async (id) => {
  const { data, error } = await supabaseRead
    .from('flights')
    .select(FLIGHT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load flight');
  return data;
};

export const findBasicById = async (id) => {
  const { data, error } = await supabaseRead
    .from('flights')
    .select(
      'id, airline_id, aircraft_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, status',
    )
    .eq('id', id)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load flight');
  return data;
};

export const aircraftBelongsToAirline = async (aircraftId, airlineId) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select('id')
    .eq('id', aircraftId)
    .eq('airline_id', airlineId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to validate aircraft');
  return Boolean(data);
};

export const findSeatsByFlightId = async (flightId) => {
  const { data, error } = await supabaseRead
    .from('seats')
    .select('id, seat_number, seat_class, status, price')
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true });

  throwDatabaseError(error, 'Unable to load seats');
  return data;
};

export const createWithSeats = async (payload) => {
  const { data, error } = await supabase.rpc('create_flight_with_seats', {
    p_airline_id: payload.airline_id,
    p_aircraft_id: payload.aircraft_id,
    p_origin_airport_id: payload.origin_airport_id,
    p_destination_airport_id: payload.destination_airport_id,
    p_flight_number: payload.flight_number,
    p_departure_time: payload.departure_time,
    p_arrival_time: payload.arrival_time,
    p_base_price: payload.base_price,
    p_status: payload.status,
    p_seats: payload.seats,
  });

  throwDatabaseError(error, 'Unable to create flight');
  return data;
};

export const update = async (flightId, payload) => {
  const { data, error } = await supabase
    .from('flights')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', flightId)
    .select(FLIGHT_COLUMNS)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to update flight');
  return data;
};
