import { supabase } from '../../config/supabase.js';
import { createHttpError, throwDatabaseError } from '../../utils/error.js';

const BOOKING_COLUMNS = `
  id, user_id, flight_id, price_snapshot, total_price, status, hold_expires_at, contact_email,
  contact_phone, notes, created_at, updated_at,
  flight:flights!bookings_flight_id_fkey(
    id, flight_number, departure_time, arrival_time, status,
    airline:airlines!flights_airline_id_fkey(id, code, name),
    origin_airport:airports!flights_origin_airport_id_fkey(id, code, city),
    destination_airport:airports!flights_destination_airport_id_fkey(id, code, city)
  ),
  passengers(id, first_name, last_name, date_of_birth, gender, nationality, passport_number, passenger_type),
  booking_seats(id, passenger_id, seat_id, seat:seats!booking_seats_seat_id_fkey(id, seat_number, seat_class, price)),
  booking_baggage(id, passenger_id, baggage_option_id, quantity, price_snapshot),
  booking_meals(id, passenger_id, meal_option_id, quantity, price_snapshot),
  booking_discounts(id, discount_id, discount_amount, applied_at),
  payments(id, amount, currency, provider, transaction_ref, status, paid_at, created_at),
  reviews(id, rating, comment, is_visible, created_at, updated_at)
`;

export const findMine = async (userId, status, from, to) => {
  let query = supabase
    .from('bookings')
    .select(BOOKING_COLUMNS, { count: 'exact' })
    .eq('user_id', userId)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  throwDatabaseError(error, 'Unable to load bookings');
  return { data, count };
};

export const findMineById = async (id, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load booking');
  return data;
};

export const findBasicMineById = async (id, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, user_id, flight_id, status, total_price, hold_expires_at, flight:flights!bookings_flight_id_fkey(id, departure_time, status)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load booking');
  return data;
};

export const createAtomically = async (userId, payload) => {
  const { data, error } = await supabase.rpc('create_booking', {
    p_user_id: userId,
    p_flight_id: payload.flightId,
    p_contact_email: payload.contactEmail,
    p_contact_phone: payload.contactPhone ?? null,
    p_notes: payload.notes ?? null,
    p_passengers: payload.passengers,
    p_seat_ids: payload.seatIds,
    p_baggage: payload.baggage,
    p_meals: payload.meals,
    p_discount_code: payload.discountCode ?? null,
  });

  if (error) {
    const status = error.code === 'P0001' ? 409 : 400;
    throw createHttpError(status, error.code === 'P0001' ? 'One or more seats are no longer available' : 'Unable to create booking');
  }

  return data;
};

export const cancelAtomically = async (bookingId, userId) => {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
  });

  if (error) {
    throw createHttpError(409, error.code === 'P0002' ? error.message : 'Unable to cancel booking');
  }

  return data;
};
