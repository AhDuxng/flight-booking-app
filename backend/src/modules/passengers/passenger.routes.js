import { Router } from 'express';
import * as controller from './passenger.controller.js';
import { getPassengerByIdSchema } from './passenger.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/:id', validate(getPassengerByIdSchema), controller.getPassengerById);

export default router;
