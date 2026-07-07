import bookingService from './booking.service.js';

/**
 * Tạo mới đơn đặt vé
 */
export const create = async (req, res, next) => {
  try {
    const data = await bookingService.createBookingService(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công!',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Lấy danh sách đơn vé cá nhân (My Bookings)
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const data = await bookingService.getMyBookingsService(req.user.id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy chi tiết một đơn vé
 */
export const getById = async (req, res, next) => {
  try {
    const data = await bookingService.getBookingByIdService(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Hủy đơn đặt vé
 */
export const cancel = async (req, res, next) => {
  try {
    const data = await bookingService.cancelBookingService(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      message: 'Hủy đơn đặt vé thành công!',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Lấy toàn bộ danh sách đơn vé (Admin)
 */
export const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;
    const data = await bookingService.getAllBookingsService(page, limit, status);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Cập nhật trạng thái đơn vé (Admin)
 */
export const updateStatus = async (req, res, next) => {
  try {
    const data = await bookingService.updateBookingStatusService(req.params.id, req.body.status);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn vé thành công!',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Xóa đơn đặt vé (Admin)
 */
export const remove = async (req, res, next) => {
  try {
    await bookingService.deleteBookingService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Xóa đơn đặt vé thành công!',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export default {
  create,
  getMyBookings,
  getById,
  cancel,
  getAll,
  updateStatus,
  remove,
};
