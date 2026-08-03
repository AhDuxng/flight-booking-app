import { api } from "@/services/api";

export const seatService = {
  getByFlight: (flightId) => api.get("/seats", { params: { flightId } }),
  hold: (payload) => api.post("/seats/hold", payload),
  release: (seatId) => api.patch(`/seats/${seatId}/release`),
};
