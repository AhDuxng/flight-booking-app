import { supabase } from '../../config/supabase.js';

export const getAllAirlines = async (activeOnly = false) => {
  let query = supabase.from('airlines').select('*').order('name', { ascending: true });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getAirlineById = async (id) => {
  const { data, error } = await supabase
    .from('airlines')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const getAirlineByCode = async (code) => {
  const { data, error } = await supabase
    .from('airlines')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const createAirline = async (airlineData) => {
  const { data, error } = await supabase
    .from('airlines')
    .insert([airlineData])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateAirline = async (id, updates) => {
  const { data, error } = await supabase
    .from('airlines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const deleteAirline = async (id) => {
  const { error } = await supabase
    .from('airlines')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export default {
  getAllAirlines,
  getAirlineById,
  getAirlineByCode,
  createAirline,
  updateAirline,
  deleteAirline,
};
