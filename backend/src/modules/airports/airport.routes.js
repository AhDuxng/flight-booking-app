import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  airportCodeParamsSchema,
  airportParamsSchema,
  createAirportSchema,
  updateAirportSchema,
} from './airport.schema.js';
import * as airportController from './airport.controller.js';

const router = Router();

router.get('/', airportController.getAllAirports);
router.get('/:code', validate({ params: airportCodeParamsSchema }), airportController.findAirportByCode);
router.post('/', authenticate, requireRole('admin'), validate(createAirportSchema), airportController.createAirport);
router.patch(
  '/:airportId',
  authenticate,
  requireRole('admin'),
  validate({ params: airportParamsSchema, body: updateAirportSchema }),
  airportController.updateAirport,
);

export default router;
