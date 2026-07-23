import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { holdSeatSchema, seatParamsSchema, seatQuerySchema } from './seat.schema.js';
import * as seatController from './seat.controller.js';

const router = Router();

router.get('/', validate({ query: seatQuerySchema }), seatController.getSeatsByFlight);
router.post('/hold', authenticate, validate(holdSeatSchema), seatController.holdSeat);
router.patch(
  '/:seatId/release',
  authenticate,
  validate({ params: seatParamsSchema }),
  seatController.releaseSeat,
);

export default router;
