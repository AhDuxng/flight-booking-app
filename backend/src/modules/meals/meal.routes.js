import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { mealQuerySchema } from './meal.schema.js';
import * as mealController from './meal.controller.js';

const router = Router();

router.get('/', validate({ query: mealQuerySchema }), mealController.getMealOptions);

export default router;
