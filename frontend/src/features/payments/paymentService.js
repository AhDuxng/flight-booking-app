import { api } from "@/services/api";

export const paymentService = {
  getConfig: () => api.get("/payments/config"),
  createIntent: (payload) => api.post("/payments/intent", payload),
  getByBooking: (bookingId) => api.get(`/payments/bookings/${bookingId}`),
  verify: (payload) => api.post("/payments/verify", payload),
};
