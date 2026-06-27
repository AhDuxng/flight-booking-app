import { Router } from 'express';
import * as controller from './meal.controller.js';
import { getMealOptionsSchema } from './meal.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.get('/', validate(getMealOptionsSchema), controller.getMealOptions);

export default router;
