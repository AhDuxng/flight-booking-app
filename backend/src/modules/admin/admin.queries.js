import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const ADMIN_FLIGHT_COLUMNS = `
  id, airline_id, aircraft_id, origin_airport_id, destination_airport_id,
  flight_number, departure_time, arrival_time, base_price, available_seats, status,
  airline:airlines!flights_airline_id_fkey(id, code, name),
  aircraft:aircrafts!flights_aircraft_id_fkey(id, code, model),
  origin_airport:airports!flights_origin_airport_id_fkey(id, code, city),
  destination_airport:airports!flights_destination_airport_id_fkey(id, code, city)
`;

export const getDashboard = async () => {
  const { data, error } = await supabase.rpc('get_admin_dashboard');
  throwDatabaseError(error, 'Unable to load dashboard');
  return data;
};

export const findFlights = async (from, to) => {
  const { data, error, count } = await supabase
    .from('flights')
    .select(ADMIN_FLIGHT_COLUMNS, { count: 'exact' })
    .range(from, to)
    .order('departure_time', { ascending: false });

  throwDatabaseError(error, 'Unable to load flights');
  return { data, count };
};

export const findBookings = async (status, from, to) => {
  let query = supabase
    .from('bookings')
    .select(`
      id, user_id, flight_id, price_snapshot, total_price, status, contact_email,
      contact_phone, created_at, updated_at,
      user:users!bookings_user_id_fkey(id, full_name),
      flight:flights!bookings_flight_id_fkey(id, flight_number, departure_time)
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  throwDatabaseError(error, 'Unable to load bookings');
  return { data, count };
};

export const findPayments = async (from, to) => {
  const { data, error, count } = await supabase
    .from('payments')
    .select(`
      id, booking_id, amount, currency, provider, transaction_ref, status, paid_at, created_at,
      booking:bookings!payments_booking_id_fkey(id, user_id, contact_email)
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load payments');
  return { data, count };
};

export const findReviews = async (from, to) => {
  const { data, error, count } = await supabase
    .from('reviews')
    .select(`
      id, user_id, booking_id, flight_id, rating, comment, is_visible, created_at,
      user:users!reviews_user_id_fkey(id, full_name),
      flight:flights!reviews_flight_id_fkey(id, flight_number)
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load reviews');
  return { data, count };
};

export const findUsers = async (from, to) => {
  const { data, error, count } = await supabase
    .from('users')
    .select('id, full_name, phone, avatar_url, date_of_birth, gender, nationality, created_at, updated_at', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load users');
  return { data, count };
};

export const logAction = async (payload) => {
  const { error } = await supabase.from('admin_logs').insert(payload);
  throwDatabaseError(error, 'Unable to create admin log');
};
