import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const DISCOUNT_COLUMNS =
  'id, code, description, discount_type, discount_value, min_order_value, max_discount, max_uses, used_count, start_date, end_date, applicable_to';

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

export const validate = async (code, orderValue) => {
  const { data, error } = await supabase.rpc('apply_discount', {
    p_code: code,
    p_order_value: orderValue,
  });

  if (error) {
    throw Object.assign(new Error('Invalid or ineligible discount code'), { status: 400 });
  }

  return data?.[0] ?? null;
};
