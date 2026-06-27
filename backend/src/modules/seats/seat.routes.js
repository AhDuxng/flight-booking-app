import { Router } from 'express';
import * as controller from './seat.controller.js';
import { getSeatsSchema, holdSeatSchema } from './seat.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', validate(getSeatsSchema), controller.getSeats);
router.post('/hold', authMiddleware, validate(holdSeatSchema), controller.holdSeat);

export default router;
