import * as queries from './notification.queries.js';

export const getNotificationsByUserId = async (userId) => {
  return await queries.getNotificationsByUserId(userId);
};

export const markAsRead = async (notificationId, userId) => {
  return await queries.markAsRead(notificationId, userId);
};
