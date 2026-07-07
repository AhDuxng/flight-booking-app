import adminService from './admin.service.js';

/**
 * Lấy thống kê tổng quan (Dashboard Stats)
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStatsService();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy danh sách người dùng
 */
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await adminService.getUsersService(page, limit);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Cập nhật trạng thái người dùng (Ví dụ: Khóa tài khoản, nâng quyền admin)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await adminService.updateUserService(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công!',
      data: updated,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export default {
  getStats,
  getUsers,
  updateUser,
};
