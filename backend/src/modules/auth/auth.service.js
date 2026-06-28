import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import authQueries from './auth.queries.js';
import { userCache, invalidateUserCache } from '../../middlewares/auth.middleware.js';

/**
 * Phát hành cặp Token đôi: Access Token (15m) + Refresh Token (7d)
 * @param {object} user - Đối tượng user { id, email, role }
 */
export const generateTokenPair = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

/**
 * Xử lý đăng ký tài khoản mới
 * @param {object} payload - { email, password, full_name, phone }
 */
export const registerService = async ({ email, password, full_name, phone }) => {
  // 1. Kiểm tra trùng email
  const existingUser = await authQueries.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('Email này đã được sử dụng. Vui lòng chọn một email khác.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Chuẩn bị dữ liệu user
  const newUserData = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    full_name,
    phone: phone || null,
    role: 'user',
    is_active: true,
  };

  const createdUser = await authQueries.createUser(newUserData);

  // 4. Phát hành cặp token
  const tokens = generateTokenPair(createdUser);

  // 5. Lưu refresh token vào DB (nếu có cột)
  await authQueries.updateRefreshToken(createdUser.id, tokens.refreshToken);

  // 6. Nạp ngay vào bộ nhớ đệm LRU Cache
  userCache.set(createdUser.id, createdUser);

  return {
    user: createdUser,
    ...tokens,
  };
};

/**
 * Xử lý đăng nhập tài khoản
 * @param {string} email 
 * @param {string} password 
 */
export const loginService = async ({ email, password }) => {
  // 1. Tìm user theo email
  const user = await authQueries.findUserByEmail(email);
  if (!user) {
    const error = new Error('Email hoặc mật khẩu không chính xác.');
    error.statusCode = 401;
    throw error;
  }

  // 2. Kiểm tra trạng thái hoạt động
  if (user.is_active === false) {
    const error = new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Đối chiếu mật khẩu
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    const error = new Error('Email hoặc mật khẩu không chính xác.');
    error.statusCode = 401;
    throw error;
  }

  // 4. Loại bỏ mật khẩu
  const { password: _, ...userWithoutPassword } = user;

  // 5. Phát hành cặp token mới
  const tokens = generateTokenPair(userWithoutPassword);

  // 6. Cập nhật refresh token mới vào DB
  await authQueries.updateRefreshToken(user.id, tokens.refreshToken);

  // 7. Nạp vào bộ nhớ đệm LRU Cache
  userCache.set(user.id, userWithoutPassword);

  return {
    user: userWithoutPassword,
    ...tokens,
  };
};

/**
 * Xử lý làm mới Access Token từ Refresh Token
 * @param {string} refreshToken 
 */
export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh Token không tồn tại. Vui lòng đăng nhập lại.');
    error.statusCode = 401;
    throw error;
  }

  try {
    // 1. Giải mã Refresh Token
    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

    // 2. Kiểm tra user trong DB
    const user = await authQueries.findUserById(decoded.id);
    if (!user || user.is_active === false) {
      invalidateUserCache(decoded.id);
      const error = new Error('Tài khoản không hợp lệ hoặc đã bị khóa.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Cấp phát cặp token mới
    const tokens = generateTokenPair(user);

    // 4. Cập nhật lại refresh token và cache
    await authQueries.updateRefreshToken(user.id, tokens.refreshToken);
    userCache.set(user.id, user);

    return {
      user,
      ...tokens,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    const err = new Error('Refresh Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Xử lý đăng xuất (Xóa cache & xóa refresh token trong DB)
 * @param {string} userId 
 */
export const logoutService = async (userId) => {
  invalidateUserCache(userId);
  await authQueries.updateRefreshToken(userId, null);
};

/**
 * Lấy thông tin chi tiết của người dùng
 * @param {string} userId 
 */
export const getProfileService = async (userId) => {
  const cachedUser = userCache.get(userId);
  if (cachedUser) return cachedUser;

  const user = await authQueries.findUserById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng.');
    error.statusCode = 404;
    throw error;
  }

  userCache.set(userId, user);
  return user;
};

export default {
  generateTokenPair,
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
  getProfileService,
};
