import { supabase } from '../../config/supabase.js';

/**
 * Lấy danh sách toàn bộ máy bay (kèm thông tin hãng hàng không)
 */
export const getAllAircrafts = async () => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select(`
      *,
      airline:airlines!airline_id ( id, name, code, logo_url )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Lấy chi tiết một máy bay theo ID
 */
export const getAircraftById = async (id) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select(`
      *,
      airline:airlines!airline_id ( id, name, code, logo_url )
    `)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Lấy máy bay theo mã code
 */
export const getAircraftByCode = async (code) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Thêm máy bay mới
 */
export const createAircraft = async (aircraftData) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .insert([aircraftData])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Cập nhật thông tin máy bay
 */
export const updateAircraft = async (id, updates) => {
  const { data, error } = await supabase
    .from('aircrafts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Xóa máy bay theo ID
 */
export const deleteAircraft = async (id) => {
  const { error } = await supabase
    .from('aircrafts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export default {
  getAllAircrafts,
  getAircraftById,
  getAircraftByCode,
  createAircraft,
  updateAircraft,
  deleteAircraft,
};
