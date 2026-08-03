import * as notificationQueries from './notification.queries.js';
import { createHttpError } from '../../utils/error.js';
import { createPagination, getPagination } from '../../utils/pagination.js';

export const getNotifications = async (userId, query) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await notificationQueries.findByUserId(userId, from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const sendNotification = async (userId, payload) => {
  return notificationQueries.insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    payload: payload.payload ?? null,
  });
};

export const markNotificationRead = async (notificationId, userId) => {
  const notification = await notificationQueries.markRead(notificationId, userId);

  if (!notification) {
    throw createHttpError(404, 'Notification not found');
  }

  return notification;
};

export const markAllNotificationsRead = async (userId) => {
  await notificationQueries.markAllRead(userId);
};
