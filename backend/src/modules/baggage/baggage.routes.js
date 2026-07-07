import express from 'express';
import baggageController from './baggage.controller.js';
import baggageSchema from './baggage.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @route GET /api/baggage/flight/:flightId
 * @desc Lấy danh sách gói hành lý của một chuyến bay (Public)
 */
router.get('/flight/:flightId', validate(baggageSchema.getByFlightIdSchema), baggageController.getByFlightId);

/**
 * @route GET /api/baggage/:id
 * @desc Lấy chi tiết gói hành lý (Public)
 */
router.get('/:id', validate(baggageSchema.getByIdSchema), baggageController.getById);

// Thao tác Admin
router.use(authenticate, authorizeRoles('admin'));

/**
 * @route POST /api/baggage
 * @desc Thêm gói hành lý mới (Admin)
 */
router.post('/', validate(baggageSchema.createBaggageSchema), baggageController.create);

/**
 * @route PUT /api/baggage/:id
 * @desc Cập nhật gói hành lý (Admin)
 */
router.put('/:id', validate(baggageSchema.updateBaggageSchema), baggageController.update);

/**
 * @route DELETE /api/baggage/:id
 * @desc Xóa gói hành lý (Admin)
 */
router.delete('/:id', validate(baggageSchema.getByIdSchema), baggageController.remove);

export default router;
