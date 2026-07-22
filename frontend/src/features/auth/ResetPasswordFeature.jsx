import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "@/components/common/Button";
import { getErrorMessage } from "@/lib/apiError";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";
import { authService } from "./authService";

export default function ResetPasswordFeature() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accessToken = useMemo(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    return hash.get("access_token") || query.get("access_token") || "";
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    if (password !== formData.get("confirmPassword")) {
      toast.error("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.resetPassword({ accessToken, password });
      toast.success("Mật khẩu đã được cập nhật. Hãy đăng nhập lại.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đặt lại mật khẩu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout description="Tạo mật khẩu mới an toàn cho tài khoản VietFly của bạn." title="Bảo vệ hành trình.">
      <div className="space-y-6"><div><h1 className="text-headline-lg text-on-surface">Mật khẩu mới</h1><p className="mt-2 text-body-md text-on-surface-variant">Mật khẩu cần có ít nhất 8 ký tự.</p></div>{accessToken ? <form className="space-y-5" onSubmit={handleSubmit}><PasswordField autoComplete="new-password" id="new-password" label="Mật khẩu mới" name="password" onToggle={() => setShowPassword((value) => !value)} showPassword={showPassword} /><PasswordField autoComplete="new-password" id="confirm-new-password" label="Xác nhận mật khẩu" name="confirmPassword" onToggle={() => setShowPassword((value) => !value)} showPassword={showPassword} /><Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button></form> : <div className="rounded-lg bg-error-container p-4 text-status-error">Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</div>}<Link className="block text-center text-label-md text-primary hover:underline" to="/login">Quay lại đăng nhập</Link></div>
    </AuthLayout>
  );
}
