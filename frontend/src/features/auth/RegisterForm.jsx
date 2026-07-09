import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, UserRound } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { authStore } from "@/store/authStore";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";
import SocialAuthButtons from "./SocialAuthButtons";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    authStore.setAuth(
      {
        email: formData.get("email"),
        fullName: formData.get("fullName"),
        role: "user",
      },
      "demo-token",
    );

    navigate("/profile");
  };

  return (
    <AuthLayout
      description="Tạo tài khoản VietFly để lưu hành khách, theo dõi đặt chỗ và nhận ưu đãi phù hợp cho chuyến đi tiếp theo."
      title="Bắt đầu hành trình mới."
    >
      <div className="space-y-7">
        <div className="text-center md:text-left">
          <h2 className="mb-2 text-headline-lg font-headline-lg text-on-surface">Đăng ký</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Tạo tài khoản để đặt vé nhanh hơn và quản lý hành trình của bạn.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            autoComplete="name"
            icon={UserRound}
            id="full-name"
            label="Họ và tên"
            name="fullName"
            placeholder="Nguyễn Văn A"
            required
            type="text"
          />
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
          <PasswordField
            autoComplete="new-password"
            id="password"
            label="Mật khẩu"
            name="password"
            onToggle={() => setShowPassword((current) => !current)}
            showPassword={showPassword}
          />
          <PasswordField
            autoComplete="new-password"
            id="confirm-password"
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            onToggle={() => setShowConfirmPassword((current) => !current)}
            showPassword={showConfirmPassword}
          />

          <label className="flex items-start gap-2 text-body-sm font-body-sm text-on-surface-variant">
            <input className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20" required type="checkbox" />
            <span>
              Tôi đồng ý với{" "}
              <Link className="text-label-md font-label-md font-semibold text-primary transition-colors hover:text-primary-container" to="/support">
                Điều khoản & Điều kiện
              </Link>{" "}
              của VietFly.
            </span>
          </label>

          <Button className="w-full" size="lg" type="submit" variant="warning">
            Tạo tài khoản
          </Button>
        </form>

        <div className="space-y-5">
          <Divider label="Hoặc đăng ký với" />
          <SocialAuthButtons />
        </div>

        <p className="text-center text-body-sm font-body-sm text-on-surface-variant">
          Đã có tài khoản?{" "}
          <Link className="text-label-md font-label-md font-semibold text-primary transition-colors hover:text-primary-container" to="/login">
            Đăng nhập
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
