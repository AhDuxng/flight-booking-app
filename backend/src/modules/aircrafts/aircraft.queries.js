import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const AIRCRAFT_COLUMNS =
  'id, airline_id, code, model, total_seats, created_at, updated_at, airline:airlines!aircrafts_airline_id_fkey(id, code, name)';

export const findAll = async () => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select(AIRCRAFT_COLUMNS)
    .order('code', { ascending: true });

  throwDatabaseError(error, 'Unable to load aircrafts');
  return data;
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select('id, airline_id, code, model, total_seats')
    .eq('id', id)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load aircraft');
  return data;
};

export const findByCode = async (code) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load aircraft');
  return data;
};

export const insert = async (payload) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .insert(payload)
    .select(AIRCRAFT_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to create aircraft');
  return data;
};

export const update = async (id, payload) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(AIRCRAFT_COLUMNS)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to update aircraft');
  return data;
};
