import { supabase } from '../../config/supabase.js';

/**
 * Tạo mới đơn đặt vé (Kèm danh sách hành khách)
 */
export const createBooking = async (bookingData, passengersList = []) => {
  // 1. Thêm đơn hàng vào bảng bookings
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select('*')
    .single();

  if (bookingErr) throw bookingErr;

  // 2. Nếu có danh sách hành khách thì thêm vào bảng passengers
  let passengers = [];
  if (passengersList && passengersList.length > 0) {
    const passengersWithBookingId = passengersList.map((p) => ({
      ...p,
      booking_id: booking.id,
    }));

    const { data: passData, error: passErr } = await supabase
      .from('passengers')
      .insert(passengersWithBookingId)
      .select('*');

    if (passErr) {
      // Nếu thêm hành khách lỗi, xóa đơn hàng vừa tạo để đảm bảo toàn vẹn dữ liệu (Rollback)
      await supabase.from('bookings').delete().eq('id', booking.id);
      throw passErr;
    }
    passengers = passData;
  }

  return { ...booking, passengers };
};

/**
 * Lấy chi tiết đơn đặt vé theo ID (kèm chuyến bay và hành khách)
 */
export const getBookingById = async (id) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights!flight_id ( * ),
      passengers:passengers ( * ),
      booking_seats:booking_seats ( id, seat:seats ( seat_number, seat_class, price ) )
    `)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Lấy danh sách đơn đặt vé của một người dùng (My Bookings)
 */
export const getBookingsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights!flight_id ( id, flight_number, departure_time, arrival_time, origin:airports!origin_id ( code, city ), destination:airports!destination_id ( code, city ) )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Lấy toàn bộ danh sách đơn vé cho Admin (có phân trang và lọc theo trạng thái)
 */
export const getAllBookings = async (limit = 20, offset = 0, status = null) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      flight:flights!flight_id ( flight_number ),
      passengers:passengers ( first_name, last_name )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * Cập nhật trạng thái đơn vé
 */
export const updateBookingStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Xóa đơn đặt vé (Chỉ áp dụng cho Admin hoặc đơn chưa thanh toán)
 */
export const deleteBooking = async (id) => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export default {
  createBooking,
  getBookingById,
  getBookingsByUserId,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
};
