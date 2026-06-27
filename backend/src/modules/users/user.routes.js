import { Router } from 'express';
import * as controller from './user.controller.js';
import { updateProfileSchema } from './user.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/profile', controller.getProfile);
router.put('/profile', validate(updateProfileSchema), controller.updateProfile);

export default router;
