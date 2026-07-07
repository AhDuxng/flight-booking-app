import { supabase } from '../../config/supabase.js';

export const getAllAirports = async () => {
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

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const getAirportByCode = async (code) => {
  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const createAirport = async (airportData) => {
  const { data, error } = await supabase
    .from('airports')
    .insert([airportData])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateAirport = async (id, updates) => {
  const { data, error } = await supabase
    .from('airports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const deleteAirport = async (id) => {
  const { error } = await supabase
    .from('airports')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export default {
  getAllAirports,
  getAirportById,
  getAirportByCode,
  createAirport,
  updateAirport,
  deleteAirport,
};
