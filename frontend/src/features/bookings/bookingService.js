import { api } from "@/services/api";

export const bookingService = {
  cancel: (bookingId) => api.patch(`/bookings/${bookingId}/cancel`),
  getCancellationQuote: (bookingId) => api.get(`/bookings/${bookingId}/cancellation-quote`),
  create: (payload, idempotencyKey) =>
    api.post("/bookings", payload, { headers: { "Idempotency-Key": idempotencyKey } }),
  getById: (bookingId) => api.get(`/bookings/${bookingId}`),
  getMine: (params) => api.get("/bookings", { params }),
};
