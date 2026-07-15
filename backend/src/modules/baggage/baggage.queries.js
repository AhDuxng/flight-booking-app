import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

export const findByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('baggage_options')
    .select('id, flight_id, weight_kg, price, description, is_available')
    .eq('flight_id', flightId)
    .eq('is_available', true)
    .order('weight_kg', { ascending: true });

  throwDatabaseError(error, 'Unable to load baggage options');
  return data;
};
