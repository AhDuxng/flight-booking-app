import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  aircraftParamsSchema,
  createAircraftSchema,
  updateAircraftSchema,
} from './aircraft.schema.js';
import * as aircraftController from './aircraft.controller.js';

const router = Router();

router.get('/', aircraftController.getAllAircrafts);
router.post('/', authenticate, requireRole('admin'), validate(createAircraftSchema), aircraftController.createAircraft);
router.patch(
  '/:aircraftId',
  authenticate,
  requireRole('admin'),
  validate({ params: aircraftParamsSchema, body: updateAircraftSchema }),
  aircraftController.updateAircraft,
);

export default router;
