import supabase from '../../config/supabase.js';

export const getPassengerById = async (id) => {
  const { data, error } = await supabase
    .from('passengers')
    .select(`
      *,
      booking:bookings(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};
