import { api } from "@/services/api";

export const paymentService = {
  getConfig: () => api.get("/payments/config"),
  createIntent: (payload, idempotencyKey) =>
    api.post("/payments/intent", payload, { headers: { "Idempotency-Key": idempotencyKey } }),
  getByBooking: (bookingId) => api.get(`/payments/bookings/${bookingId}`),
  verify: (payload) => api.post("/payments/verify", payload),
};
