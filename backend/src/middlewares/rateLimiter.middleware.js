import rateLimit from 'express-rate-limit';

/**
 * Giới hạn chung cho toàn bộ các API endpoint (100 request / 15 phút từ 1 IP)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  standardHeaders: true, // Trả về RateLimit headers theo chuẩn RFC 6585
  legacyHeaders: false, // Vô hiệu hóa X-RateLimit-* headers cũ
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
  },
});

/**
 * Giới hạn nghiêm ngặt cho các endpoint nhạy cảm như Đăng nhập, Đăng ký, Đặt lại mật khẩu (5 request / 15 phút)
 * Giúp ngăn chặn tấn công dò mật khẩu (Brute-force) và từ chối dịch vụ (DDoS)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn 10 lần thử trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử xác thực thất bại từ IP này. Vui lòng đợi 15 phút trước khi thử lại.',
  },
});

export default {
  apiLimiter,
  authLimiter,
};
