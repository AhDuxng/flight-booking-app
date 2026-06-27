import React, { createContext, useContext, useState } from 'react';
import api from '../services/api.js';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const list = response.data.data;
      setNotifications(list);
      
      const unreads = list.filter(n => !n.read_at).length;
      setUnreadCount(unreads);
      return list;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: response.data.data.read_at } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return response.data.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
