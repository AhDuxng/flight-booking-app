import { api } from "@/services/api";

export const notificationService = {
  getAll: (params) => api.get("/notifications", { params }),
  markAllRead: () => api.patch("/notifications/read-all"),
  markRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
};
