import express from 'express';
import bookingController from './booking.controller.js';
import bookingSchema from './booking.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

// Tất cả các thao tác đặt vé đều yêu cầu người dùng phải đăng nhập (authenticate)
router.use(authenticate);

/**
 * @route POST /api/bookings
 * @desc Tạo mới đơn đặt vé (Kèm danh sách hành khách)
 */
router.post('/', validate(bookingSchema.createBookingSchema), bookingController.create);

/**
 * @route GET /api/bookings/my
 * @desc Lấy danh sách đơn đặt vé của cá nhân đang đăng nhập
 */
router.get('/my', bookingController.getMyBookings);

/**
 * @route GET /api/bookings/:id
 * @desc Lấy chi tiết đơn đặt vé (Có bảo mật RLS: chỉ chủ sở hữu hoặc admin mới được xem)
 */
router.get('/:id', validate(bookingSchema.getByIdSchema), bookingController.getById);

/**
 * @route PATCH /api/bookings/:id/cancel
 * @desc Hủy đơn đặt vé của cá nhân
 */
router.patch('/:id/cancel', validate(bookingSchema.getByIdSchema), bookingController.cancel);

// --- CÁC THAO TÁC DÀNH RIÊNG CHO ADMIN ---
router.use(authorizeRoles('admin'));

/**
 * @route GET /api/bookings
 * @desc Lấy toàn bộ danh sách đơn đặt vé trong hệ thống (Admin)
 */
router.get('/', bookingController.getAll);

/**
 * @route PATCH /api/bookings/:id/status
 * @desc Cập nhật trạng thái đơn vé (Admin)
 */
router.patch('/:id/status', validate(bookingSchema.updateStatusSchema), bookingController.updateStatus);

/**
 * @route DELETE /api/bookings/:id
 * @desc Xóa đơn đặt vé (Admin)
 */
router.delete('/:id', validate(bookingSchema.getByIdSchema), bookingController.remove);

export default router;
