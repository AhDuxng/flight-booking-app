import { supabase } from '../../config/supabase.js';

/**
 * Lấy tổng số người dùng
 */
export const countUsers = async () => {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

/**
 * Lấy tổng số chuyến bay
 */
export const countFlights = async () => {
  const { count, error } = await supabase
    .from('flights')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

/**
 * Lấy tổng số đơn đặt vé
 */
export const countBookings = async () => {
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

/**
 * Lấy tổng doanh thu từ các đơn hàng đã thanh toán hoặc xác nhận
 */
export const calculateTotalRevenue = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('total_price')
    .in('status', ['paid', 'confirmed']);
  if (error) throw error;
  const total = data?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0;
  return total;
};

/**
 * Lấy danh sách người dùng cho Admin
 */
export const getUsersList = async (limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
};

/**
 * Cập nhật trạng thái hoặc quyền người dùng
 */
export const updateUserStatus = async (id, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, email, full_name, role, is_active')
    .single();
  if (error) throw error;
  return data;
};

export default {
  countUsers,
  countFlights,
  countBookings,
  calculateTotalRevenue,
  getUsersList,
  updateUserStatus,
};
