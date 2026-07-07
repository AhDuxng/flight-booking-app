import { supabase } from '../../config/supabase.js';

export const getBaggageByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('baggage_options')
    .select('*')
    .eq('flight_id', flightId)
    .eq('is_available', true)
    .order('weight_kg', { ascending: true });

  if (error) throw error;
  return data;
};

export const getBaggageById = async (id) => {
  const { data, error } = await supabase
    .from('baggage_options')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const createBaggage = async (baggageData) => {
  const { data, error } = await supabase
    .from('baggage_options')
    .insert([baggageData])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateBaggage = async (id, updates) => {
  const { data, error } = await supabase
    .from('baggage_options')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const deleteBaggage = async (id) => {
  const { error } = await supabase
    .from('baggage_options')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export default {
  getBaggageByFlightId,
  getBaggageById,
  createBaggage,
  updateBaggage,
  deleteBaggage,
};
