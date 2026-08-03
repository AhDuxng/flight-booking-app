import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

export const findByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('meal_options')
    .select('id, flight_id, name, description, price, meal_type, image_url, is_available')
    .eq('flight_id', flightId)
    .eq('is_available', true)
    .order('price', { ascending: true });

  throwDatabaseError(error, 'Unable to load meal options');
  return data;
};
