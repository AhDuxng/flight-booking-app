/**
 * Middleware phân quyền (Role-based Access Control - RBAC)
 * @param {...string} roles - Danh sách các vai trò được phép truy cập (ví dụ: 'admin', 'staff')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu xác thực trước khi kiểm tra quyền truy cập.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò (${req.user.role}) của bạn không có quyền thực hiện thao tác này.`,
      });
    }

    return next();
  };
};

export default authorizeRoles;
