import express from 'express';
import authController from './auth.controller.js';
import authSchema from './auth.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Đăng ký tài khoản người dùng mới
 * @access Public (Áp dụng authLimiter chống Brute-force & Validate schema)
 */
router.post('/register', authLimiter, validate(authSchema.registerSchema), authController.register);

/**
 * @route POST /api/auth/login
 * @desc Đăng nhập tài khoản
 * @access Public (Áp dụng authLimiter & Validate schema)
 */
router.post('/login', authLimiter, validate(authSchema.loginSchema), authController.login);

/**
 * @route POST /api/auth/refresh-token
 * @desc Làm mới Access Token bằng Refresh Token (qua Cookie hoặc Body)
 * @access Public
 */
router.post('/refresh-token', validate(authSchema.refreshTokenSchema), authController.refresh);
router.post('/refresh', validate(authSchema.refreshTokenSchema), authController.refresh); // Bí danh (alias) tiện lợi

/**
 * @route POST /api/auth/logout
 * @desc Đăng xuất tài khoản (Xóa cache, xóa Refresh Token DB & Cookie)
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route GET /api/auth/me
 * @desc Lấy thông tin tài khoản đang đăng nhập (Sử dụng LRU Cache tối ưu)
 * @access Private
 */
router.get('/me', authenticate, authController.getMe);

export default router;
