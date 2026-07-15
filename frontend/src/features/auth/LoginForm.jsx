import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { authStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/apiError";
import { authService } from "./authService";
import { toast } from "sonner";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";
import SocialAuthButtons from "./SocialAuthButtons";

export default function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      const response = await authService.login({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      const { token, user } = response.data;

      if (!token) {
        toast.info("Vui lòng xác nhận email trước khi đăng nhập.");
        return;
      }

      authStore.setAuth(user, token);
      navigate(searchParams.get("redirect") || "/profile");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đăng nhập."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Trải nghiệm đặt vé máy bay nhanh chóng, tiện lợi và an toàn cùng VietFly. Hành trình của bạn bắt đầu từ đây."
      title="Mở cánh cửa ra thế giới."
    >
      <div className="space-y-8">
        <div className="text-center md:text-left">
          <h2 className="mb-2 text-headline-lg font-headline-lg text-on-surface">Đăng nhập</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Chào mừng bạn quay trở lại. Vui lòng đăng nhập để tiếp tục.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            icon={Mail}
            id="email"
            label="Địa chỉ Email"
            name="email"
            placeholder="nhap@email.com"
            required
            type="email"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-label-md font-label-md text-on-surface">Mật khẩu</span>
              <button className="text-label-md font-label-md text-primary transition-colors hover:text-primary-container" type="button">
                Quên mật khẩu?
              </button>
            </div>
            <PasswordField
              autoComplete="current-password"
              id="password"
              label=""
              name="password"
              onToggle={() => setShowPassword((current) => !current)}
              showPassword={showPassword}
            />
          </div>

          <label className="flex items-center">
            <input
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
              name="rememberMe"
              type="checkbox"
            />
            <span className="ml-2 block text-body-sm font-body-sm text-on-surface-variant">Ghi nhớ đăng nhập</span>
          </label>

          <Button className="w-full" disabled={isSubmitting} size="lg" type="submit" variant="warning">
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="space-y-6">
          <Divider label="Hoặc tiếp tục với" />
          <SocialAuthButtons />
        </div>

        <p className="text-center text-body-sm font-body-sm text-on-surface-variant">
          Chưa có tài khoản?{" "}
          <Link className="text-label-md font-label-md font-semibold text-primary transition-colors hover:text-primary-container" to="/register">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function Divider({ label }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-outline-variant" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface px-2 text-body-sm font-body-sm text-on-surface-variant">{label}</span>
      </div>
    </div>
  );
}
