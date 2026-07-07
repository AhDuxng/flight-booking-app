import express from 'express';
import adminController from './admin.controller.js';
import adminSchema from './admin.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

// Tất cả các route admin đều yêu cầu đăng nhập và có quyền admin
router.use(authenticate, authorizeRoles('admin'));

/**
 * @route GET /api/admin/stats
 * @desc Lấy thống kê tổng quan (Doanh thu, chuyến bay, đơn đặt vé, người dùng)
 */
router.get('/stats', adminController.getStats);

/**
 * @route GET /api/admin/users
 * @desc Lấy danh sách người dùng trong hệ thống
 */
router.get('/users', validate(adminSchema.getUsersSchema), adminController.getUsers);

/**
 * @route PATCH /api/admin/users/:id
 * @desc Cập nhật quyền hoặc trạng thái khóa/mở khóa tài khoản người dùng
 */
router.patch('/users/:id', validate(adminSchema.updateUserSchema), adminController.updateUser);

export default router;
