import * as notificationService from './notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications(req.user.id, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const data = await notificationService.markNotificationRead(
      req.params.notificationId,
      req.user.id,
    );
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsRead(req.user.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
