import { api } from "@/services/api";

export const adminService = {
  createAircraft: (payload) => api.post("/aircrafts", payload),
  createAirline: (payload) => api.post("/airlines", payload),
  createAirport: (payload) => api.post("/airports", payload),
  createFlight: (payload) => api.post("/admin/flights", payload),
  getAircrafts: (params) => api.get("/aircrafts", { params }),
  getAirlines: (params) => api.get("/airlines", { params }),
  getAirports: (params) => api.get("/airports", { params }),
  getBookings: (params) => api.get("/admin/bookings", { params }),
  getDashboard: () => api.get("/admin/dashboard"),
  getFlights: (params) => api.get("/admin/flights", { params }),
  getPayments: (params) => api.get("/admin/payments", { params }),
  getReviews: (params) => api.get("/admin/reviews", { params }),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateFlight: (flightId, payload) => api.patch(`/admin/flights/${flightId}`, payload),
};
