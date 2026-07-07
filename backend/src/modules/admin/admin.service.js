import adminQueries from './admin.queries.js';
import { invalidateUserCache } from '../../middlewares/auth.middleware.js';

/**
 * Lấy số liệu thống kê tổng quan cho Admin Dashboard
 */
export const getDashboardStatsService = async () => {
  const [totalUsers, totalFlights, totalBookings, totalRevenue] = await Promise.all([
    adminQueries.countUsers(),
    adminQueries.countFlights(),
    adminQueries.countBookings(),
    adminQueries.calculateTotalRevenue(),
  ]);

  return {
    totalUsers,
    totalFlights,
    totalBookings,
    totalRevenue,
  };
};

/**
 * Lấy danh sách người dùng với phân trang
 */
export const getUsersService = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const users = await adminQueries.getUsersList(limit, offset);
  return {
    users,
    page,
    limit,
  };
};

/**
 * Cập nhật trạng thái người dùng (khóa tài khoản / đổi quyền)
 */
export const updateUserService = async (userId, updates) => {
  const updatedUser = await adminQueries.updateUserStatus(userId, updates);
  // Xóa cache để đảm bảo thay đổi quyền/trạng thái có hiệu lực tức thì
  invalidateUserCache(userId);
  return updatedUser;
};

export default {
  getDashboardStatsService,
  getUsersService,
  updateUserService,
};
