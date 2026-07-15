import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { createAirlineSchema, airlineParamsSchema, updateAirlineSchema } from './airline.schema.js';
import * as airlineController from './airline.controller.js';

const router = Router();

router.get('/', airlineController.getAllAirlines);
router.post('/', authenticate, requireRole('admin'), validate(createAirlineSchema), airlineController.createAirline);
router.patch(
  '/:airlineId',
  authenticate,
  requireRole('admin'),
  validate({ params: airlineParamsSchema, body: updateAirlineSchema }),
  airlineController.updateAirline,
);

export default router;
