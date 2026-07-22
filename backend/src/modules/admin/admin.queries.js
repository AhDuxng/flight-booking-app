import { supabase } from '../../config/supabase.js';
import { createHttpError, throwDatabaseError } from '../../utils/error.js';

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
      flight:flights!bookings_flight_id_fkey(id, flight_number, departure_time, status)
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

export const findBookingById = async (bookingId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, user_id, status')
    .eq('id', bookingId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load booking');
  return data;
};

export const findActiveBookingsByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, user_id, status')
    .eq('flight_id', flightId)
    .in('status', ['pending', 'paid', 'confirmed']);

  throwDatabaseError(error, 'Unable to load affected bookings');
  return data ?? [];
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

export const findPaymentById = async (paymentId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id, booking_id, amount, provider, transaction_ref, status, booking:bookings!payments_booking_id_fkey(id, user_id, status)')
    .eq('id', paymentId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load payment');
  return data;
};

export const refundPayment = async (paymentId) => {
  const { data, error } = await supabase.rpc('process_payment_refund', {
    p_payment_id: paymentId,
  });

  if (error) {
    throw createHttpError(409, 'Payment is not awaiting refund');
  }

  return data;
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

export const findUserById = async (userId) => {
  const [profileResult, bookingsResult, reviewsResult, notificationsResult, authResult] = await Promise.all([
    supabase.from('users').select('id, full_name, phone, avatar_url, date_of_birth, gender, nationality, passport_number, created_at, updated_at').eq('id', userId).maybeSingle(),
    supabase.from('bookings').select('id, total_price, status, created_at, flight:flights!bookings_flight_id_fkey(id, flight_number, departure_time)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id, booking_id, rating, comment, is_visible, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('notifications').select('id, type, title, body, read_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.auth.admin.getUserById(userId),
  ]);

  throwDatabaseError(profileResult.error, 'Unable to load user');
  throwDatabaseError(bookingsResult.error, 'Unable to load user bookings');
  throwDatabaseError(reviewsResult.error, 'Unable to load user reviews');
  throwDatabaseError(notificationsResult.error, 'Unable to load user notifications');

  if (authResult.error) {
    throw new Error('Unable to load auth user');
  }

  return profileResult.data ? {
    ...profileResult.data,
    email: authResult.data.user?.email ?? null,
    role: authResult.data.user?.app_metadata?.role ?? 'user',
    bookings: bookingsResult.data ?? [],
    reviews: reviewsResult.data ?? [],
    notifications: notificationsResult.data ?? [],
  } : null;
};

export const updateReviewVisibility = async (reviewId, isVisible) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('id, user_id, booking_id, flight_id, rating, comment, is_visible, created_at, updated_at')
    .maybeSingle();

  throwDatabaseError(error, 'Unable to moderate review');
  return data;
};

export const logAction = async (payload) => {
  const { error } = await supabase.from('admin_logs').insert(payload);
  throwDatabaseError(error, 'Unable to create admin log');
};
