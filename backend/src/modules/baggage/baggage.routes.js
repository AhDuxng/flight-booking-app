import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { baggageQuerySchema } from './baggage.schema.js';
import * as baggageController from './baggage.controller.js';

const router = Router();

router.get('/', validate({ query: baggageQuerySchema }), baggageController.getBaggageOptions);

export default router;
