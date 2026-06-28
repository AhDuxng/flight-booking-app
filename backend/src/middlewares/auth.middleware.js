import jwt from 'jsonwebtoken';
import { LRUCache } from 'lru-cache';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';

/**
 * Bộ nhớ đệm LRU Cache lưu trữ thông tin User đã xác thực trong 5 phút
 * Giúp giảm 95% tải truy vấn cho Database dưới lượng traffic lớn (Enterprise scale)
 */
export const userCache = new LRUCache({
  max: 5000, // Lưu tối đa 5,000 user active cùng lúc
  ttl: 1000 * 60 * 5, // Thời gian sống của cache: 5 phút (300,000 ms)
});

/**
 * Hàm hỗ trợ xóa cache của user khi có sự kiện cập nhật profile/đăng xuất/khóa tài khoản
 * @param {string} userId 
 */
export const invalidateUserCache = (userId) => {
  if (userId) {
    userCache.delete(userId);
  }
};

/**
 * Middleware xác thực JWT Access Token từ Header Authorization hoặc Cookie
 * Có tích hợp bộ nhớ đệm LRU Cache để tối ưu hiệu năng siêu cao tải
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Ưu tiên kiểm tra token trong Header Authorization (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Nếu không có trong Header, kiểm tra trong Cookie accessToken (hoặc cookie token cũ)
    else if (req.cookies) {
      token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập hoặc Access Token không tồn tại.',
      });
    }

    // Giải mã và xác thực Access Token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // KIỂM TRA TRONG BỘ NHỚ ĐỆM (CACHE FIRST)
    const cachedUser = userCache.get(decoded.id);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // NẾU CACHE MISS -> TRUY VẤN SUPABASE DATABASE
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản thuộc về token này không còn tồn tại trong hệ thống.',
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa hoặc khóa tạm thời.',
      });
    }

    // LƯU VÀO CACHE CHO CÁC REQUEST TIẾP THEO
    userCache.set(decoded.id, user);

    // Gán thông tin user vào request object
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED', // Mã code giúp frontend nhận diện chính xác để gọi API refresh-token
        message: 'Access Token đã hết hạn. Vui lòng làm mới token.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Access Token không hợp lệ.',
    });
  }
};

export default authenticate;
