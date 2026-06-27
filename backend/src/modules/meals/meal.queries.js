import supabase from '../../config/supabase.js';

export const getMealOptionsByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('meal_options')
    .select('*')
    .eq('flight_id', flightId)
    .eq('is_available', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};
