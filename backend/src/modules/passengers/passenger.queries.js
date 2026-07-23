import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

export const findOwnedBooking = async (bookingId, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load booking');
  return data;
};

export const findByBookingId = async (bookingId) => {
  const { data, error } = await supabase
    .from('passengers')
    .select(
      'id, booking_id, first_name, last_name, date_of_birth, gender, nationality, passport_number, passenger_type',
    )
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  throwDatabaseError(error, 'Unable to load passengers');
  return data;
};
