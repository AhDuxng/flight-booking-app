import { Router } from 'express';
import * as controller from './aircraft.controller.js';
import { createAircraftSchema, updateAircraftSchema, getAircraftByIdSchema } from './aircraft.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { isAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/', controller.getAircrafts);
router.get('/:id', validate(getAircraftByIdSchema), controller.getAircraftById);

// Admin-only routes
router.post('/', authMiddleware, isAdmin, validate(createAircraftSchema), controller.createAircraft);
router.put('/:id', authMiddleware, isAdmin, validate(updateAircraftSchema), controller.updateAircraft);
router.delete('/:id', authMiddleware, isAdmin, validate(getAircraftByIdSchema), controller.deleteAircraft);

export default router;
