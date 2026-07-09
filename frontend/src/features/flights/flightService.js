import { api } from "@/services/api";

export const flightService = {
  getById: (flightId) => api.get(`/flights/${flightId}`),
  getSeats: (flightId) => api.get(`/flights/${flightId}/seats`),
  search: (params) => api.get("/flights", { params }),
};
