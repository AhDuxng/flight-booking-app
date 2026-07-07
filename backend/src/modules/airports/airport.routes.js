import express from 'express';
import airportController from './airport.controller.js';
import airportSchema from './airport.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @route GET /api/airports
 * @desc Lấy danh sách sân bay (Public)
 */
router.get('/', airportController.getAll);

/**
 * @route GET /api/airports/:id
 * @desc Lấy chi tiết sân bay (Public)
 */
router.get('/:id', validate(airportSchema.getAirportByIdSchema), airportController.getById);

// Thao tác Admin
router.use(authenticate, authorizeRoles('admin'));

/**
 * @route POST /api/airports
 * @desc Thêm sân bay mới (Admin)
 */
router.post('/', validate(airportSchema.createAirportSchema), airportController.create);

/**
 * @route PUT /api/airports/:id
 * @desc Cập nhật sân bay (Admin)
 */
router.put('/:id', validate(airportSchema.updateAirportSchema), airportController.update);

/**
 * @route DELETE /api/airports/:id
 * @desc Xóa sân bay (Admin)
 */
router.delete('/:id', validate(airportSchema.getAirportByIdSchema), airportController.remove);

export default router;
