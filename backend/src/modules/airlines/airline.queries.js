import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const AIRLINE_COLUMNS = 'id, code, name, logo_url, country, is_active, created_at, updated_at';

export const findAll = async () => {
  const { data, error } = await supabase
    .from('airlines')
    .select(AIRLINE_COLUMNS)
    .order('name', { ascending: true });

  throwDatabaseError(error, 'Unable to load airlines');
  return data;
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from('airlines')
    .select(AIRLINE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load airline');
  return data;
};

export const findByCode = async (code) => {
  const { data, error } = await supabase
    .from('airlines')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load airline');
  return data;
};

export const insert = async (payload) => {
  const { data, error } = await supabase
    .from('airlines')
    .insert(payload)
    .select(AIRLINE_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to create airline');
  return data;
};

export const update = async (id, payload) => {
  const { data, error } = await supabase
    .from('airlines')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(AIRLINE_COLUMNS)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to update airline');
  return data;
};
