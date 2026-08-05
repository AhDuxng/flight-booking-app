import { supabase, supabaseRead } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';
import { logger } from '../../utils/logger.js';
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

const runReadQuery = async (operation, event) => {
  let result = await operation(supabaseRead);

  if (result.error && supabaseRead !== supabase) {
    logger.warn(event, {
      database_code: result.error.code,
      error: result.error.message,
    });
    result = await operation(supabase);
  }

  return result;
};

const dynamicPriceMultiplier = (availableSeats, totalSeats) => {
  if (totalSeats <= 0 || availableSeats / totalSeats > 0.5) return 1;
  if (availableSeats / totalSeats > 0.25) return 1.1;
  if (availableSeats / totalSeats > 0.1) return 1.2;
  return 1.35;
};

const loadFlightCandidates = async (filters, departureFrom, departureTo) => {
  const pageSize = 1_000;
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('flights')
      .select(`${FLIGHT_COLUMNS}, schedule:flight_schedules!flights_schedule_id_fkey(id, is_active)`)
      .in('status', ['scheduled', 'delayed'])
      .gt('departure_time', dayjs().add(45, 'minute').toISOString())
      .gte('departure_time', departureFrom)
      .order('departure_time', { ascending: true })
      .range(from, from + pageSize - 1);

    if (departureTo) query = query.lt('departure_time', departureTo);
    if (filters.originAirportId) query = query.eq('origin_airport_id', filters.originAirportId);
    if (filters.destinationAirportId) {
      query = query.eq('destination_airport_id', filters.destinationAirportId);
    }
    if (filters.airlineId) query = query.eq('airline_id', filters.airlineId);
    if (filters.flightNumber) query = query.eq('flight_number', filters.flightNumber);

    const { data, error } = await query;
    throwDatabaseError(error, 'Unable to load flight search candidates');
    const page = data ?? [];
    rows.push(...page);

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows.filter((flight) => !flight.schedule || flight.schedule.is_active);
};

const loadSeatInventory = async (flightIds, cabinClass) => {
  const seatsByFlight = new Map(flightIds.map((flightId) => [flightId, []]));
  const batchSize = 100;

  for (let index = 0; index < flightIds.length; index += batchSize) {
    let query = supabase
      .from('seats')
      .select('flight_id, status, seat_class, price')
      .in('flight_id', flightIds.slice(index, index + batchSize));
    if (cabinClass) query = query.eq('seat_class', cabinClass);

    const { data, error } = await query;
    throwDatabaseError(error, 'Unable to load flight seat inventory');
    for (const seat of data ?? []) seatsByFlight.get(seat.flight_id)?.push(seat);
  }

  return seatsByFlight;
};

const searchFromTables = async (filters, departureFrom, departureTo, from, to) => {
  const flights = await loadFlightCandidates(filters, departureFrom, departureTo);
  if (flights.length === 0) return { data: [], count: 0 };

  const seatsByFlight = await loadSeatInventory(
    flights.map((flight) => flight.id),
    filters.cabinClass,
  );
  const passengerCount = filters.passengerCount ?? 1;
  const eligibleFlights = flights.flatMap((flight) => {
    const inventory = seatsByFlight.get(flight.id) ?? [];
    const availableSeats = inventory.filter((seat) => seat.status === 'available').length;
    if (availableSeats < passengerCount) return [];

    const prices = inventory.map((seat) => Number(seat.price)).filter(Number.isFinite);
    const basePrice = prices.length > 0 ? Math.min(...prices) : Number(flight.base_price);
    const multiplier = dynamicPriceMultiplier(availableSeats, inventory.length);
    const { schedule, ...flightData } = flight;

    return [{
      ...flightData,
      available_seats: availableSeats,
      dynamic_price: Math.round(basePrice * multiplier),
      dynamic_price_multiplier: multiplier,
      sellable: true,
    }];
  });

  return {
    data: eligibleFlights.slice(from, to + 1),
    count: eligibleFlights.length,
  };
};

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

  const rpcParams = {
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
  };
  const { data, error } = await runReadQuery(
    (client) => client.rpc('search_flights_v2', rpcParams),
    'flight_search_read_fallback',
  );
  if (error) {
    logger.warn('flight_search_rpc_fallback', {
      database_code: error.code,
      error: error.message,
    });
    return searchFromTables(filters, departureFrom, departureTo, from, to);
  }
  return { data: data?.data ?? [], count: Number(data?.count ?? 0) };
};

export const findCalculatedPrice = async (flightId) => {
  const { data, error } = await runReadQuery(
    (client) => client.rpc('calculate_flight_price', {
      p_flight_id: flightId,
      p_cabin_class: null,
      p_fare_id: null,
    }),
    'flight_price_read_fallback',
  );
  throwDatabaseError(error, 'Unable to calculate flight price');
  return Number(data);
};

export const findById = async (id) => {
  const { data, error } = await runReadQuery(
    (client) => client.from('flights').select(FLIGHT_COLUMNS).eq('id', id).maybeSingle(),
    'flight_detail_read_fallback',
  );

  throwDatabaseError(error, 'Unable to load flight');
  return data;
};

export const findBasicById = async (id) => {
  const { data, error } = await runReadQuery(
    (client) => client
      .from('flights')
      .select(
        'id, airline_id, aircraft_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, status',
      )
      .eq('id', id)
      .maybeSingle(),
    'flight_basic_read_fallback',
  );

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
  const { data, error } = await runReadQuery(
    (client) => client
      .from('seats')
      .select('id, seat_number, seat_class, status, price')
      .eq('flight_id', flightId)
      .order('seat_number', { ascending: true }),
    'flight_seats_read_fallback',
  );

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
