import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

/**
 * Re-export các middleware bảo mật chung để sử dụng tiện lợi trong module Auth
 * và các module khác khi import từ gói auth
 */
export { authenticate, authorizeRoles };

/**
 * Middleware đặc thù cho module auth: Kiểm tra tài khoản có phải Admin hoặc chính chủ (Self or Admin)
 * Thường dùng khi cập nhật profile hoặc đổi mật khẩu cho một ID cụ thể
 */
export const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập trước.' });
  }

  const targetUserId = req.params.id || req.body.userId;

  if (req.user.role === 'admin' || req.user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền thao tác trên tài khoản của người khác.',
  });
};

export default {
  authenticate,
  authorizeRoles,
  requireSelfOrAdmin,
};
