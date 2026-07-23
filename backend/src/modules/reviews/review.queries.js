import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const REVIEW_COLUMNS =
  'id, user_id, booking_id, flight_id, rating, comment, is_visible, created_at, updated_at';

const attachUserProfiles = async (reviews = []) => {
  const userIds = [...new Set(reviews.map((review) => review.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    return reviews;
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  throwDatabaseError(error, 'Unable to load reviewer profiles');
  const usersById = new Map((users ?? []).map((user) => [user.id, user]));

  return reviews.map((review) => ({
    ...review,
    user: usersById.get(review.user_id) ?? null,
  }));
};

const attachUserProfile = async (review) => {
  if (!review) {
    return review;
  }

  const [result] = await attachUserProfiles([review]);
  return result;
};

export const findByFlightId = async (flightId, from, to) => {
  const { data, error, count } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS, { count: 'exact' })
    .eq('flight_id', flightId)
    .eq('is_visible', true)
    .range(from, to)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load reviews');
  return { data: await attachUserProfiles(data ?? []), count };
};

export const findBookingForUser = async (bookingId, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, flight_id, status, flight:flights!bookings_flight_id_fkey(status, arrival_time)')
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
  return attachUserProfile(data);
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
  return attachUserProfile(data);
};
