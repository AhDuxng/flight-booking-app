import supabase from '../../config/supabase.js';

export const getAirports = async () => {
  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .order('city', { ascending: true });
  if (error) throw error;
  return data;
};

export const getAirportById = async (id) => {
  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const createAirport = async (airportData) => {
  const { data, error } = await supabase
    .from('airports')
    .insert(airportData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAirport = async (id, airportData) => {
  const { data, error } = await supabase
    .from('airports')
    .update(airportData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAirport = async (id) => {
  const { data, error } = await supabase
    .from('airports')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
