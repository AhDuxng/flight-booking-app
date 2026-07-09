import { api } from "@/services/api";

export const authService = {
  getMe: () => api.get("/users/me"),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  register: (payload) => api.post("/auth/register", payload),
  updateProfile: (payload) => api.patch("/users/me", payload),
};
