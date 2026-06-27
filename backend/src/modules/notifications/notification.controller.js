import * as service from './notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await service.getNotificationsByUserId(req.user.id);
    return res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const result = await service.markAsRead(req.params.id, req.user.id);
    return res.status(200).json({
      message: 'Notification marked as read successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
