import bookingQueries from './booking.queries.js';
import { supabase } from '../../config/supabase.js';

/**
 * Tạo đơn đặt vé mới
 */
export const createBookingService = async (userId, data) => {
  const { flight_id, passengers = [], contact_email, contact_phone, notes, total_price, price_snapshot } = data;

  // Kiểm tra chuyến bay có tồn tại không
  const { data: flight, error: flightErr } = await supabase
    .from('flights')
    .select('id, base_price, status')
    .eq('id', flight_id)
    .single();

  if (flightErr || !flight) {
    const error = new Error('Chuyến bay không tồn tại hoặc đã bị hủy.');
    error.statusCode = 404;
    throw error;
  }

  if (flight.status === 'cancelled') {
    const error = new Error('Chuyến bay này đã bị hủy, không thể đặt vé.');
    error.statusCode = 400;
    throw error;
  }

  // Chuẩn bị dữ liệu đơn hàng
  const bookingData = {
    user_id: userId,
    flight_id,
    price_snapshot: price_snapshot || flight.base_price,
    total_price: total_price || (flight.base_price * (passengers.length || 1)),
    status: 'pending',
    contact_email,
    contact_phone,
    notes,
  };

  return await bookingQueries.createBooking(bookingData, passengers);
};

/**
 * Lấy chi tiết đơn vé (Có kiểm tra bảo mật quyền sở hữu RLS)
 */
export const getBookingByIdService = async (bookingId, userId, userRole) => {
  const booking = await bookingQueries.getBookingById(bookingId);
  if (!booking) {
    const error = new Error('Không tìm thấy thông tin đơn đặt vé.');
    error.statusCode = 404;
    throw error;
  }

  // Bảo mật: Khách hàng bình thường chỉ được xem đơn vé của chính mình
  if (userRole !== 'admin' && booking.user_id !== userId) {
    const error = new Error('Bạn không có quyền xem thông tin đơn vé này.');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

/**
 * Lấy danh sách đơn vé của cá nhân (My Bookings)
 */
export const getMyBookingsService = async (userId) => {
  return await bookingQueries.getBookingsByUserId(userId);
};

/**
 * Lấy toàn bộ danh sách đơn vé (Dành cho Admin)
 */
export const getAllBookingsService = async (page = 1, limit = 20, status = null) => {
  const offset = (page - 1) * limit;
  const bookings = await bookingQueries.getAllBookings(limit, offset, status);
  return { bookings, page, limit, status };
};

/**
 * Hủy đơn đặt vé
 */
export const cancelBookingService = async (bookingId, userId, userRole) => {
  const booking = await getBookingByIdService(bookingId, userId, userRole);

  if (['cancelled', 'refunded'].includes(booking.status)) {
    const error = new Error('Đơn vé này đã ở trạng thái hủy trước đó.');
    error.statusCode = 400;
    throw error;
  }

  // Nếu đơn đã thanh toán thì chuyển thành chờ hoàn tiền (refund_pending), ngược lại thì hủy luôn (cancelled)
  const newStatus = booking.status === 'paid' ? 'refund_pending' : 'cancelled';
  return await bookingQueries.updateBookingStatus(bookingId, newStatus);
};

/**
 * Cập nhật trạng thái đơn vé (Admin)
 */
export const updateBookingStatusService = async (bookingId, status) => {
  const booking = await bookingQueries.getBookingById(bookingId);
  if (!booking) {
    const error = new Error('Không tìm thấy thông tin đơn đặt vé.');
    error.statusCode = 404;
    throw error;
  }
  return await bookingQueries.updateBookingStatus(bookingId, status);
};

/**
 * Xóa đơn đặt vé (Admin)
 */
export const deleteBookingService = async (bookingId) => {
  const booking = await bookingQueries.getBookingById(bookingId);
  if (!booking) {
    const error = new Error('Không tìm thấy thông tin đơn đặt vé.');
    error.statusCode = 404;
    throw error;
  }
  return await bookingQueries.deleteBooking(bookingId);
};

export default {
  createBookingService,
  getBookingByIdService,
  getMyBookingsService,
  getAllBookingsService,
  cancelBookingService,
  updateBookingStatusService,
  deleteBookingService,
};
