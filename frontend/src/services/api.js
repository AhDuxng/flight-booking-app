import axios from "axios";
import { authStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

let refreshRequest = null;

api.interceptors.request.use((config) => {
  const token = authStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const request = error.config;
    const refreshToken = authStore.getState().refreshToken;
    const isAuthRequest = request?.url?.startsWith("/auth/");

    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isAuthRequest &&
      refreshToken
    ) {
      request._retry = true;

      try {
        refreshRequest ??= axios
          .post(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 15000 })
          .then((response) => response.data.data)
          .finally(() => {
            refreshRequest = null;
          });
        const session = await refreshRequest;
        authStore.setAuth(
          session.user,
          session.token,
          session.refreshToken,
          session.expiresAt,
          authStore.getState().rememberMe,
        );
        request.headers.Authorization = `Bearer ${session.token}`;
        return api(request);
      } catch {
        refreshRequest = null;
      }
    }

    if (error.response?.status === 401 && !isAuthRequest) {
      authStore.clearAuth();

      if (typeof window !== "undefined") {
        const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.href = `/login?redirect=${redirect}`;
      }
    }

    return Promise.reject(error.response?.data ?? error);
  },
);
