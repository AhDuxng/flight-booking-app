import supabase from '../../config/supabase.js';

export const getAircrafts = async () => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select(`
      *,
      airline:airlines(name, code)
    `)
    .order('model', { ascending: true });
  if (error) throw error;
  return data;
};

export const getAircraftById = async (id) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select(`
      *,
      airline:airlines(name, code)
    `)
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const createAircraft = async (aircraftData) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .insert(aircraftData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAircraft = async (id, aircraftData) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .update(aircraftData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAircraft = async (id) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
