import { useEffect, useState } from "react";
import {
  Award,
  Camera,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  Plane,
  Save,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import { authStore } from "@/store/authStore";
import { authService } from "./authService";

const inputClass =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function UserProfileFeature() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authService.getMe();
      setProfile(response.data);
      setForm(toForm(response.data));
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải hồ sơ."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await authService.updateProfile({
        fullName: form.fullName,
        phone: form.phone || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        nationality: form.nationality || null,
        passportNumber: form.passportNumber || null,
      });
      setProfile(response.data);
      setForm(toForm(response.data));
      const auth = authStore.getState();
      authStore.updateUser({
        ...auth.user,
        fullName: response.data.full_name ?? auth.user?.fullName,
      });
      toast.success("Đã cập nhật hồ sơ.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể cập nhật hồ sơ."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await authService.uploadAvatar(file);
      setProfile(response.data);
      const auth = authStore.getState();
      authStore.updateUser({ ...auth.user, avatarUrl: response.data.avatar_url });
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể tải ảnh đại diện."));
    } finally {
      event.target.value = "";
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      toast.error(
        "Không thể thu hồi phiên trên máy chủ. Bạn vẫn đã được đăng xuất khỏi thiết bị này.",
      );
    } finally {
      authStore.clearAuth();
      navigate("/");
    }
  };

  if (isLoading) {
    return <Loading label="Đang tải hồ sơ" />;
  }

  if (error || !profile || !form) {
    return (
      <div className="mx-auto max-w-4xl px-container-padding py-section-gap">
        <ErrorMessage message={error} onRetry={loadProfile} />
      </div>
    );
  }

  return (
    <main className="min-w-0 flex-grow bg-surface-container">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-stack-lg lg:col-span-8">
          <section className="flex flex-col gap-stack-md rounded-xl border border-surface-container-high bg-surface-container-lowest p-container-padding shadow-sm sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-fixed text-primary">
                {profile.avatar_url ? (
                  <img
                    alt="Ảnh đại diện"
                    className="h-full w-full object-cover"
                    src={profile.avatar_url}
                  />
                ) : (
                  <User className="h-9 w-9" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-sm hover:bg-primary-container">
                <Camera className="h-4 w-4" />
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={isUploadingAvatar}
                  onChange={handleAvatarChange}
                  type="file"
                />
              </label>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-headline-lg text-primary">
                {profile.full_name || "Người dùng VietFly"}
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {isUploadingAvatar ? "Đang tải ảnh đại diện..." : "JPEG, PNG hoặc WebP, tối đa 2MB"}
              </p>
              <p className="mt-2 flex items-center gap-2 text-body-md text-on-surface-variant">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
              <p className="mt-1 flex items-center gap-2 text-body-md text-on-surface-variant">
                <Phone className="h-4 w-4" />
                {profile.phone || "Chưa cập nhật số điện thoại"}
              </p>
            </div>
          </section>
          <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-container-padding shadow-sm">
            <h2 className="border-b border-outline-variant pb-3 text-title-lg text-primary">
              Thông tin cá nhân
            </h2>
            <form
              className="mt-stack-md grid grid-cols-1 gap-gutter-md md:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <Field label="Họ và tên">
                <input
                  className={inputClass}
                  name="fullName"
                  onChange={handleChange(setForm)}
                  required
                  value={form.fullName}
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  className={inputClass}
                  name="phone"
                  onChange={handleChange(setForm)}
                  type="tel"
                  value={form.phone}
                />
              </Field>
              <Field label="Ngày sinh">
                <input
                  className={inputClass}
                  name="dateOfBirth"
                  onChange={handleChange(setForm)}
                  type="date"
                  value={form.dateOfBirth}
                />
              </Field>
              <Field label="Giới tính">
                <select
                  className={inputClass}
                  name="gender"
                  onChange={handleChange(setForm)}
                  value={form.gender}
                >
                  <option value="">Chưa cập nhật</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Field>
              <Field label="Quốc tịch">
                <input
                  className={inputClass}
                  name="nationality"
                  onChange={handleChange(setForm)}
                  value={form.nationality}
                />
              </Field>
              <Field label="Số hộ chiếu/CCCD">
                <input
                  className={inputClass}
                  name="passportNumber"
                  onChange={handleChange(setForm)}
                  value={form.passportNumber}
                />
              </Field>
              <div className="flex justify-end md:col-span-2">
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-label-md text-on-primary disabled:opacity-50"
                  disabled={isSaving}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </section>
        </div>
        <aside className="flex flex-col gap-stack-lg lg:col-span-4">
          <section className="rounded-xl bg-primary p-container-padding text-on-primary shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg">Tài khoản VietFly</h2>
              <Award className="h-6 w-6 text-secondary-fixed" />
            </div>
            <p className="mt-2 text-body-sm text-primary-fixed">
              Bạn có thể quản lý toàn bộ hành trình, thanh toán và thông tin liên hệ tại đây.
            </p>
          </section>
          {profile.role === "admin" ? (
            <Link
              className="flex items-center justify-between rounded-xl bg-primary p-container-padding text-on-primary shadow-sm transition-colors hover:bg-primary-container"
              to="/admin"
            >
              <span className="flex items-center gap-2 text-title-lg">
                <LayoutDashboard className="h-5 w-5" />
                Trang admin
              </span>
              <span>→</span>
            </Link>
          ) : null}
          <Link
            className="flex items-center justify-between rounded-xl border border-surface-container-high bg-surface-container-lowest p-container-padding text-primary shadow-sm hover:bg-surface-container-low"
            to="/my-bookings"
          >
            <span className="flex items-center gap-2 text-title-lg">
              <Plane className="h-5 w-5" />
              Chuyến đi của tôi
            </span>
            <span>→</span>
          </Link>
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-status-error/30 bg-surface-container-lowest p-container-padding text-label-md font-semibold text-status-error shadow-sm hover:bg-error-container/30"
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </aside>
      </div>
    </main>
  );
}

function toForm(profile) {
  return {
    fullName: profile.full_name ?? "",
    phone: profile.phone ?? "",
    dateOfBirth: profile.date_of_birth ?? "",
    gender: profile.gender ?? "",
    nationality: profile.nationality ?? "",
    passportNumber: profile.passport_number ?? "",
  };
}

function handleChange(setForm) {
  return (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-md text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
