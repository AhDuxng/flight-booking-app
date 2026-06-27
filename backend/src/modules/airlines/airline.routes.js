import { Router } from 'express';
import * as controller from './airline.controller.js';
import { createAirlineSchema, updateAirlineSchema, getAirlineByIdSchema } from './airline.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { isAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/', controller.getAirlines);
router.get('/:id', validate(getAirlineByIdSchema), controller.getAirlineById);

// Admin-only routes
router.post('/', authMiddleware, isAdmin, validate(createAirlineSchema), controller.createAirline);
router.put('/:id', authMiddleware, isAdmin, validate(updateAirlineSchema), controller.updateAirline);
router.delete('/:id', authMiddleware, isAdmin, validate(getAirlineByIdSchema), controller.deleteAirline);

export default router;
