import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { flightParamsSchema, flightSearchSchema } from './flight.schema.js';
import * as flightController from './flight.controller.js';

const router = Router();

router.get('/', validate({ query: flightSearchSchema }), flightController.searchFlights);
router.get('/:flightId/seats', validate({ params: flightParamsSchema }), flightController.getFlightSeats);
router.get('/:flightId', validate({ params: flightParamsSchema }), flightController.getFlightById);

export default router;
