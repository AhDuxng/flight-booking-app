import { api } from "@/services/api";

export const bookingService = {
  cancel: (bookingId) => api.patch(`/bookings/${bookingId}/cancel`),
  create: (payload) => api.post("/bookings", payload),
  getById: (bookingId) => api.get(`/bookings/${bookingId}`),
  getMine: (params) => api.get("/bookings", { params }),
};
