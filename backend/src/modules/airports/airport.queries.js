import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const AIRPORT_COLUMNS = 'id, code, name, city, country, timezone, created_at, updated_at';

export const findAll = async () => {
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLUMNS)
    .order('city', { ascending: true });

  throwDatabaseError(error, 'Unable to load airports');
  return data;
};

export const findByCode = async (code) => {
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLUMNS)
    .eq('code', code)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load airport');
  return data;
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load airport');
  return data;
};

export const insert = async (payload) => {
  const { data, error } = await supabase
    .from('airports')
    .insert(payload)
    .select(AIRPORT_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to create airport');
  return data;
};

export const update = async (id, payload) => {
  const { data, error } = await supabase
    .from('airports')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(AIRPORT_COLUMNS)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to update airport');
  return data;
};
