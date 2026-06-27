import supabase from '../../config/supabase.js';

export const getBaggageOptionsByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('baggage_options')
    .select('*')
    .eq('flight_id', flightId)
    .eq('is_available', true)
    .order('weight_kg', { ascending: true });

  if (error) throw error;
  return data;
};
