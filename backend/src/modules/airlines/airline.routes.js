import express from 'express';
import airlineController from './airline.controller.js';
import airlineSchema from './airline.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @route GET /api/airlines
 * @desc Lấy danh sách hãng hàng không (Public)
 */
router.get('/', airlineController.getAll);

/**
 * @route GET /api/airlines/:id
 * @desc Lấy chi tiết hãng hàng không (Public)
 */
router.get('/:id', validate(airlineSchema.getAirlineByIdSchema), airlineController.getById);

// Thao tác Admin
router.use(authenticate, authorizeRoles('admin'));

/**
 * @route POST /api/airlines
 * @desc Thêm hãng hàng không mới (Admin)
 */
router.post('/', validate(airlineSchema.createAirlineSchema), airlineController.create);

/**
 * @route PUT /api/airlines/:id
 * @desc Cập nhật hãng hàng không (Admin)
 */
router.put('/:id', validate(airlineSchema.updateAirlineSchema), airlineController.update);

/**
 * @route DELETE /api/airlines/:id
 * @desc Xóa hãng hàng không (Admin)
 */
router.delete('/:id', validate(airlineSchema.getAirlineByIdSchema), airlineController.remove);

export default router;
