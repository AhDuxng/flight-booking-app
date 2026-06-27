import { Router } from 'express';
import * as controller from './admin.controller.js';
import { getLogsSchema } from './admin.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { isAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(isAdmin);

router.get('/stats', controller.getStats);
router.get('/logs', validate(getLogsSchema), controller.getLogs);

export default router;
