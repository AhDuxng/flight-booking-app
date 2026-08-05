import { api } from "@/services/api";

export const seatService = {
  getByFlight: (flightId) => api.get("/seats", { params: { flightId } }),
};
