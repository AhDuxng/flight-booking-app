import { Router } from 'express';
import * as controller from './notification.controller.js';
import { markReadSchema } from './notification.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.getNotifications);
router.put('/:id/read', validate(markReadSchema), controller.markRead);

export default router;
