import { Router } from 'express';
import * as controller from './baggage.controller.js';
import { getBaggageOptionsSchema } from './baggage.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.get('/', validate(getBaggageOptionsSchema), controller.getBaggageOptions);

export default router;
