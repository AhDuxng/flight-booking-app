import supabase from '../../config/supabase.js';

export const getSeatsByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true });

  if (error) throw error;
  return data;
};

export const holdSeat = async (seatId, bookingId) => {
  const { error } = await supabase.rpc('hold_seat', {
    p_seat_id: seatId,
    p_booking_id: bookingId
  });

  if (error) throw error;
  return true;
};
