import express from 'express';
import aircraftController from './aircraft.controller.js';
import aircraftSchema from './aircraft.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @route GET /api/aircrafts
 * @desc Lấy danh sách tất cả máy bay (Public)
 */
router.get('/', aircraftController.getAll);

/**
 * @route GET /api/aircrafts/:id
 * @desc Lấy chi tiết máy bay (Public)
 */
router.get('/:id', validate(aircraftSchema.getAircraftByIdSchema), aircraftController.getById);

// Các thao tác thêm, sửa, xóa yêu cầu quyền Admin
router.use(authenticate, authorizeRoles('admin'));

/**
 * @route POST /api/aircrafts
 * @desc Thêm máy bay mới (Admin)
 */
router.post('/', validate(aircraftSchema.createAircraftSchema), aircraftController.create);

/**
 * @route PUT /api/aircrafts/:id
 * @desc Cập nhật thông tin máy bay (Admin)
 */
router.put('/:id', validate(aircraftSchema.updateAircraftSchema), aircraftController.update);

/**
 * @route DELETE /api/aircrafts/:id
 * @desc Xóa máy bay (Admin)
 */
router.delete('/:id', validate(aircraftSchema.getAircraftByIdSchema), aircraftController.remove);

export default router;
