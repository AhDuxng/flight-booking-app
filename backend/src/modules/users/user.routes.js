import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { uploadAvatar } from '../../middlewares/upload.middleware.js';
import { updateProfileSchema } from './user.schema.js';
import * as userController from './user.controller.js';

const router = Router();

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.post('/me/avatar', uploadAvatar, userController.uploadAvatar);

export default router;
