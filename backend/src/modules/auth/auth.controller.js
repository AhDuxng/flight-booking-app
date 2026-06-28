import authService from './auth.service.js';
import { env } from '../../config/env.js';

/**
 * Cấu hình Cookie cho Access Token (Ngắn hạn 15 phút)
 */
const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 phút
});

/**
 * Cấu hình Cookie cho Refresh Token (Dài hạn 7 ngày)
 */
const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/', // Dùng chung cho toàn ứng dụng hoặc có thể giới hạn cho đường dẫn refresh
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
});

/**
 * Hàm hỗ trợ ghi nhận cặp token vào Cookie phản hồi
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
  // Giữ cookie token cũ nhằm tương thích ngược nếu frontend cần
  res.cookie('token', accessToken, getAccessTokenCookieOptions());
};

/**
 * Xử lý yêu cầu Đăng ký tài khoản
 */
export const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.registerService(req.body);

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Xử lý yêu cầu Đăng nhập
 */
export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginService(req.body);

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Xử lý làm mới Access Token từ Refresh Token
 */
export const refresh = async (req, res, next) => {
  try {
    // Nhận Refresh Token từ Cookie hoặc từ Body request
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const { user, accessToken, refreshToken } = await authService.refreshTokenService(incomingRefreshToken);

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Làm mới token thành công.',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Xử lý yêu cầu Đăng xuất (Xóa Cookie & Thu hồi Token trong DB)
 */
export const logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await authService.logoutService(req.user.id);
    }

    const clearOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);
    res.clearCookie('token', clearOptions);

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất an toàn thành công!',
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy thông tin tài khoản đang đăng nhập hiện tại (Get Me)
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfileService(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  getMe,
};
