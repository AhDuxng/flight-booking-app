import { supabase } from '../../config/supabase.js';
import { createHttpError, throwDatabaseError } from '../../utils/error.js';

export const findByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('id, seat_number, seat_class, status, price')
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true });

  throwDatabaseError(error, 'Unable to load seats');
  return data;
};

export const findOwnedBooking = async (bookingId, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, flight_id, status')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load booking');
  return data;
};

export const findById = async (seatId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('id, flight_id, booking_id, status')
    .eq('id', seatId)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load seat');
  return data;
};

export const hold = async (seatId, bookingId) => {
  const { error } = await supabase.rpc('hold_seat', {
    p_seat_id: seatId,
    p_booking_id: bookingId,
  });

  if (error) {
    throw createHttpError(409, 'Seat is no longer available');
  }
};

export const release = async (seatId, bookingId) => {
  const { error } = await supabase.rpc('release_held_seat', {
    p_seat_id: seatId,
    p_booking_id: bookingId,
  });

  if (error) {
    throw createHttpError(400, 'Unable to release seat');
  }
};
