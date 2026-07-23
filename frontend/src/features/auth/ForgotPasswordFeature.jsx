import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { getErrorMessage } from "@/lib/apiError";
import AuthLayout from "./AuthLayout";
import { authService } from "./authService";

export default function ForgotPasswordFeature() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      await authService.forgotPassword({ email: formData.get("email") });
      setIsSent(true);
      toast.success("Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi email đặt lại mật khẩu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Khôi phục quyền truy cập tài khoản VietFly bằng email đã đăng ký."
      title="Đặt lại mật khẩu."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-headline-lg text-on-surface">Quên mật khẩu</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Nhập email để nhận liên kết khôi phục tài khoản.
          </p>
        </div>
        {isSent ? (
          <div className="rounded-lg bg-primary-fixed p-4 text-body-md text-on-primary-fixed">
            Hãy kiểm tra hộp thư và thư rác. Liên kết khôi phục chỉ có hiệu lực trong thời gian giới
            hạn.
          </div>
        ) : null}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            icon={Mail}
            label="Địa chỉ Email"
            name="email"
            required
            type="email"
          />
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang gửi..." : "Gửi liên kết khôi phục"}
          </Button>
        </form>
        <Link className="block text-center text-label-md text-primary hover:underline" to="/login">
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
