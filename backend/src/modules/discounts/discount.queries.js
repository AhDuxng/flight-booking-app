import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const DISCOUNT_COLUMNS =
  'id, code, description, discount_type, discount_value, min_order_value, max_discount, max_uses, used_count, start_date, end_date, applicable_to, is_active';

export const findActive = async () => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('discounts')
    .select(DISCOUNT_COLUMNS)
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('end_date', { ascending: true });

  throwDatabaseError(error, 'Unable to load discounts');
  return data;
};

export const findByCode = async (code) => {
  const { data, error } = await supabase
    .from('discounts')
    .select(DISCOUNT_COLUMNS)
    .eq('code', code)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to validate discount');
  return data;
};
