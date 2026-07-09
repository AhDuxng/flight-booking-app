import { authStore, useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const auth = useAuthStore();

  return {
    ...auth,
    clearAuth: authStore.clearAuth,
    setAuth: authStore.setAuth,
    updateUser: authStore.updateUser,
  };
};
