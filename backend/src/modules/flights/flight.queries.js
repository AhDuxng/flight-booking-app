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
  const searchColumns = filters.cabinClass
    ? `${FLIGHT_COLUMNS}, inventory:seats!inner(id, seat_class, status)`
    : FLIGHT_COLUMNS;
  let query = supabaseRead
    .from('flights')
    .select(searchColumns, { count: 'planned' })
    .range(from, to)
    .order('departure_time', { ascending: true });

  if (filters.originAirportId) {
    query = query.eq('origin_airport_id', filters.originAirportId);
  }

  if (filters.destinationAirportId) {
    query = query.eq('destination_airport_id', filters.destinationAirportId);
  }

  if (filters.airlineId) {
    query = query.eq('airline_id', filters.airlineId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.in('status', ['scheduled', 'boarding', 'delayed']);
  }

  if (filters.departureDate) {
    const start = dayjs
      .tz(filters.departureDate, filters.departureTimezone ?? 'UTC')
      .startOf('day');
    const end = start.add(1, 'day');
    const lowerBound = start.isAfter(dayjs()) ? start : dayjs();
    query = query
      .gte('departure_time', lowerBound.toISOString())
      .lt('departure_time', end.toISOString());
  } else {
    query = query.gte('departure_time', new Date().toISOString());
  }

  query = query.gte('available_seats', filters.passengerCount ?? 1);

  if (filters.cabinClass) {
    query = query
      .eq('inventory.seat_class', filters.cabinClass)
      .eq('inventory.status', 'available');
  }

  const { data, error, count } = await query;
  throwDatabaseError(error, 'Unable to load flights');
  return {
    data: data.map(({ inventory, ...flight }) => flight),
    count,
  };
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
