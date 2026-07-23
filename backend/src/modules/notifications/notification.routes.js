import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { notificationParamsSchema, notificationQuerySchema } from './notification.schema.js';
import * as notificationController from './notification.controller.js';

const router = Router();

router.get(
  '/',
  validate({ query: notificationQuerySchema }),
  notificationController.getNotifications,
);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.patch(
  '/:notificationId/read',
  validate({ params: notificationParamsSchema }),
  notificationController.markNotificationRead,
);

export default router;
