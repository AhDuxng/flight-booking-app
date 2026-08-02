import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

export const findByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('id, seat_number, seat_class, status, price')
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true });

  throwDatabaseError(error, 'Unable to load seats');
  return data;
};
