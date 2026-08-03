import { api } from "@/services/api";

export const reviewService = {
  create: (payload) => api.post("/reviews", payload),
  getByFlight: (flightId, params) => api.get("/reviews", { params: { flightId, ...params } }),
  update: (reviewId, payload) => api.patch(`/reviews/${reviewId}`, payload),
};
