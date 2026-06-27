import { Router } from 'express';
import * as controller from './airport.controller.js';
import { createAirportSchema, updateAirportSchema, getAirportByIdSchema } from './airport.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { isAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/', controller.getAirports);
router.get('/:id', validate(getAirportByIdSchema), controller.getAirportById);

// Admin routes
router.post('/', authMiddleware, isAdmin, validate(createAirportSchema), controller.createAirport);
router.put('/:id', authMiddleware, isAdmin, validate(updateAirportSchema), controller.updateAirport);
router.delete('/:id', authMiddleware, isAdmin, validate(getAirportByIdSchema), controller.deleteAirport);

export default router;
