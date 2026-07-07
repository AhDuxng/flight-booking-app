import { supabase } from '../../config/supabase.js';

/**
 * Lấy danh sách mã giảm giá
 */
export const getAllDiscounts = async (activeOnly = false) => {
  let query = supabase.from('discounts').select('*').order('created_at', { ascending: false });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * Lấy chi tiết mã giảm giá theo ID
 */
export const getDiscountById = async (id) => {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Lấy mã giảm giá theo CODE (Ví dụ: SUMMER2026)
 */
export const getDiscountByCode = async (code) => {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Thêm mới mã giảm giá (Admin)
 */
export const createDiscount = async (discountData) => {
  const { data, error } = await supabase
    .from('discounts')
    .insert([discountData])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Cập nhật thông tin mã giảm giá (Admin)
 */
export const updateDiscount = async (id, updates) => {
  const { data, error } = await supabase
    .from('discounts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Tăng lượt sử dụng mã giảm giá lên 1
 */
export const incrementUsedCount = async (id, currentCount) => {
  const { data, error } = await supabase
    .from('discounts')
    .update({ used_count: currentCount + 1, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Xóa mã giảm giá
 */
export const deleteDiscount = async (id) => {
  const { error } = await supabase
    .from('discounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export default {
  getAllDiscounts,
  getDiscountById,
  getDiscountByCode,
  createDiscount,
  updateDiscount,
  incrementUsedCount,
  deleteDiscount,
};
