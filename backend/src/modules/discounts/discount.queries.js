import supabase from '../../config/supabase.js';

export const validateDiscountRpc = async (code, orderValue) => {
  const { data, error } = await supabase.rpc('apply_discount', {
    p_code: code,
    p_order_value: orderValue
  });
  
  if (error) {
    throw error;
  }
  return data; // returns array of { discount_id: UUID, discount_amount: NUMERIC }
};
