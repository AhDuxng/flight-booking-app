import { supabase } from '../../config/supabase.js';

/**
 * Tìm người dùng theo email
 * @param {string} email 
 */
export const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

/**
 * Tìm người dùng theo ID (không bao gồm mật khẩu)
 * @param {string} id 
 */
export const findUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

/**
 * Tạo người dùng mới trong cơ sở dữ liệu
 * @param {object} userData - { id, email, password, full_name, phone, role }
 */
export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select('id, email, full_name, phone, role, is_active, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Cập nhật mật khẩu người dùng
 * @param {string} id 
 * @param {string} hashedPassword 
 */
export const updateUserPassword = async (id, hashedPassword) => {
  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Cập nhật Refresh Token vào DB (Nếu bảng users có cột refresh_token)
 * Giúp thu hồi token hoặc đăng xuất từ xa
 * @param {string} id 
 * @param {string|null} refreshToken 
 */
export const updateRefreshToken = async (id, refreshToken) => {
  try {
    await supabase
      .from('users')
      .update({ refresh_token: refreshToken, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch (err) {
    // Nếu bảng chưa thêm cột refresh_token, bỏ qua không làm sập luồng đăng nhập
    console.warn('⚠️ Gợi ý: Hãy thêm cột `refresh_token` (TEXT) vào bảng `users` trên Supabase để tối ưu bảo mật Refresh Token.');
  }
};

export default {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  updateRefreshToken,
};
