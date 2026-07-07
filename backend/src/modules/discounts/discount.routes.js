import express from 'express';
import discountController from './discount.controller.js';
import discountSchema from './discount.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @route GET /api/discounts
 * @desc Lấy danh sách các mã giảm giá đang hoạt động (Public)
 */
router.get('/', discountController.getAll);

/**
 * @route POST /api/discounts/apply
 * @desc Kiểm tra và tính toán số tiền được giảm khi nhập mã voucher (Public)
 */
router.post('/apply', validate(discountSchema.applyDiscountSchema), discountController.apply);

/**
 * @route GET /api/discounts/:id
 * @desc Lấy chi tiết một mã giảm giá (Public)
 */
router.get('/:id', validate(discountSchema.getByIdSchema), discountController.getById);

// --- CÁC THAO TÁC QUẢN LÝ VOUCHER DÀNH RIÊNG CHO ADMIN ---
router.use(authenticate, authorizeRoles('admin'));

/**
 * @route POST /api/discounts
 * @desc Tạo mới mã giảm giá (Admin)
 */
router.post('/', validate(discountSchema.createDiscountSchema), discountController.create);

/**
 * @route PUT /api/discounts/:id
 * @desc Cập nhật thông tin mã giảm giá (Admin)
 */
router.put('/:id', validate(discountSchema.updateDiscountSchema), discountController.update);

/**
 * @route DELETE /api/discounts/:id
 * @desc Xóa mã giảm giá (Admin)
 */
router.delete('/:id', validate(discountSchema.getByIdSchema), discountController.remove);

export default router;
