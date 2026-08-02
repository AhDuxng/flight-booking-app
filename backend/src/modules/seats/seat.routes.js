import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { seatQuerySchema } from './seat.schema.js';
import * as seatController from './seat.controller.js';

const router = Router();

router.get('/', validate({ query: seatQuerySchema }), seatController.getSeatsByFlight);

export default router;
