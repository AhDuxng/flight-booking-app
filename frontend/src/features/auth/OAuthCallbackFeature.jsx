import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import { authStore } from "@/store/authStore";
import { authService } from "./authService";

export default function OAuthCallbackFeature() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const finishOAuth = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const expiresAt = hash.get("expires_at");
      if (!accessToken) {
        setError(hash.get("error_description") || "Phản hồi đăng nhập không hợp lệ.");
        return;
      }
      authStore.setAuth(null, accessToken, refreshToken, expiresAt ? Number(expiresAt) : null);
      try {
        const response = await authService.getSession();
        authStore.setAuth(response.data.user, accessToken, refreshToken, expiresAt ? Number(expiresAt) : null);
        navigate("/profile", { replace: true });
      } catch (requestError) {
        authStore.clearAuth();
        setError(getErrorMessage(requestError, "Không thể hoàn tất đăng nhập."));
      }
    };
    finishOAuth();
  }, [navigate]);

  return error ? <div className="mx-auto max-w-xl p-section-gap"><ErrorMessage message={error} /></div> : <Loading label="Đang hoàn tất đăng nhập" />;
}
