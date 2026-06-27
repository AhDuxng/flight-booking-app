import { Router } from 'express';
import * as controller from './flight.controller.js';
import { searchFlightsSchema, getFlightByIdSchema } from './flight.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.get('/', validate(searchFlightsSchema), controller.searchFlights);
router.get('/:id', validate(getFlightByIdSchema), controller.getFlightById);

export default router;
