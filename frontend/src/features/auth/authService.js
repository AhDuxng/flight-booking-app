import { api } from "@/services/api";

export const authService = {
  getMe: () => api.get("/users/me"),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  register: (payload) => api.post("/auth/register", payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/me/avatar", formData);
  },
  updateProfile: (payload) => api.patch("/users/me", payload),
};
