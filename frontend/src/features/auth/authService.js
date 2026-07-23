import { api } from "@/services/api";

export const authService = {
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  getMe: () => api.get("/users/me"),
  getOAuthUrl: (provider) => api.get(`/auth/oauth/${provider}`),
  getSession: () => api.get("/auth/session"),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
  register: (payload) => api.post("/auth/register", payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/me/avatar", formData);
  },
  updateProfile: (payload) => api.patch("/users/me", payload),
};
