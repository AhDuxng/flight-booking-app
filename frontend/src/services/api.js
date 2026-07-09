import axios from "axios";
import { authStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      authStore.clearAuth();

      if (typeof window !== "undefined") {
        const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.href = `/login?redirect=${redirect}`;
      }
    }

    return Promise.reject(error.response?.data ?? error);
  },
);
