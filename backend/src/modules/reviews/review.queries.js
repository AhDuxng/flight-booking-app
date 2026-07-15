import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const REVIEW_COLUMNS = 'id, user_id, booking_id, flight_id, rating, comment, is_visible, created_at, updated_at, user:users!reviews_user_id_fkey(full_name, avatar_url)';

export const findByFlightId = async (flightId, from, to) => {
  const { data, error, count } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS, { count: 'exact' })
    .eq('flight_id', flightId)
    .eq('is_visible', true)
    .range(from, to)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load reviews');
  return { data, count };
};

export const findBookingForUser = async (bookingId, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, flight_id, status')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load booking');
  return data;
};

export const insert = async (payload) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(payload)
    .select(REVIEW_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to create review');
  return data;
};

export const findOwnedById = async (id, userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load review');
  return data;
};

export const update = async (id, payload) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(REVIEW_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to update review');
  return data;
};
