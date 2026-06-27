import supabase from '../../config/supabase.js';

export const getAirlines = async () => {
  const { data, error } = await supabase
    .from('airlines')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const getAirlineById = async (id) => {
  const { data, error } = await supabase
    .from('airlines')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const createAirline = async (airlineData) => {
  const { data, error } = await supabase
    .from('airlines')
    .insert(airlineData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAirline = async (id, airlineData) => {
  const { data, error } = await supabase
    .from('airlines')
    .update(airlineData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAirline = async (id) => {
  const { data, error } = await supabase
    .from('airlines')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
