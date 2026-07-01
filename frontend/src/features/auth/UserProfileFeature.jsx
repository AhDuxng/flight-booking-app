import {
  ArrowRight,
  Award,
  Edit3,
  Mail,
  Phone,
  Plane,
  Plus,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const userProfile = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  phone: "+84 90 123 4567",
  birthDate: "1985-08-15",
  nationality: "Việt Nam",
  identityNumber: "001085123456",
  avatar: "/src/assets/images/avatar.jpg",
  loyalty: {
    tier: "VietFly Gold",
    points: "45.200",
    nextTier: "Còn 4.800 điểm để lên Platinum",
  },
};

const navItems = [
  { label: "Thông tin cá nhân", icon: User, active: true },
  { label: "Chuyến đi của tôi", icon: Plane },
  { label: "Hành khách đã lưu", icon: Users },
  { label: "Cài đặt", icon: Settings },
];

function Panel({ children, className = "" }) {
  return (
    <section
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest/95 p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

function ProfileSummaryCard() {
  return (
    <Panel className="relative flex min-w-0 flex-col items-center gap-stack-md overflow-hidden sm:flex-row sm:items-start">
      <div className="absolute left-0 top-0 h-24 w-full bg-primary-fixed-dim/30" />
      <div className="relative z-10 mt-8 h-24 w-24 flex-none overflow-hidden rounded-full border-4 border-surface-container-lowest shadow-sm sm:mt-4">
        <img alt="User Avatar" className="h-full w-full object-cover" src={userProfile.avatar} />
      </div>
      <div className="relative z-10 mt-4 flex min-w-0 flex-1 flex-col items-center text-center sm:mt-12 sm:items-start sm:text-left">
        <h1 className="mb-base font-headline-lg text-headline-lg text-primary">{userProfile.name}</h1>
        <p className="mb-stack-sm flex min-w-0 items-center gap-2 font-body-md text-body-md text-slate-gray">
          <Mail className="h-4 w-4 flex-none" />
          <span className="truncate">{userProfile.email}</span>
        </p>
        <p className="flex min-w-0 items-center gap-2 font-body-md text-body-md text-slate-gray">
          <Phone className="h-4 w-4 flex-none" />
          <span className="truncate">{userProfile.phone}</span>
        </p>
      </div>
      <div className="relative z-10 w-full sm:mt-12 sm:w-auto">
        <button className="inline-flex h-10 w-full max-w-full items-center justify-center gap-2 rounded-lg border border-primary bg-surface-container-lowest px-4 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low sm:w-auto">
          <Edit3 className="h-4 w-4 flex-none" />
          <span className="truncate">Chỉnh sửa hồ sơ</span>
        </button>
      </div>
    </Panel>
  );
}

function LoyaltyCard() {
  return (
    <section className="flex min-w-0 flex-col justify-between rounded-xl border border-primary-container bg-gradient-to-br from-primary to-primary-container p-stack-md text-on-primary shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div>
        <div className="mb-stack-sm flex min-w-0 items-center justify-between gap-stack-md">
          <h2 className="min-w-0 truncate font-title-lg text-title-lg text-secondary-fixed">{userProfile.loyalty.tier}</h2>
          <Award className="h-6 w-6 flex-none text-secondary-fixed" />
        </div>
        <p className="mb-stack-md font-body-sm text-body-sm opacity-90">Hạng thẻ hội viên</p>
      </div>
      <div>
        <div className="mb-base flex min-w-0 justify-between gap-stack-md font-data-mono text-data-mono">
          <span className="min-w-0 truncate">Điểm tích lũy</span>
          <span className="font-bold">{userProfile.loyalty.points}</span>
        </div>
        <div className="mb-2 h-1.5 w-full rounded-full bg-surface-tint">
          <div className="h-1.5 w-3/4 rounded-full bg-secondary-container" />
        </div>
        <p className="text-right font-body-sm text-xs text-on-primary opacity-80">{userProfile.loyalty.nextTier}</p>
      </div>
    </section>
  );
}

function ProfileNav() {
  return (
    <nav className="flex min-w-0 flex-col gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest/95 p-stack-sm shadow-[0_4px_12px_rgba(26,54,93,0.05)] backdrop-blur lg:sticky lg:top-24">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-lg p-3 text-left font-label-md text-label-md transition-colors",
              item.active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
            )}
            key={item.label}
          >
            <Icon className="h-5 w-5 flex-none" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="font-label-md text-label-md text-slate-gray">{label}</span>
      {children}
    </label>
  );
}

function ProfileForm() {
  const inputClass =
    "w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow focus:ring-2 focus:ring-primary/20";

  return (
    <Panel>
      <h2 className="mb-stack-md border-b border-outline-variant pb-2 font-title-lg text-title-lg text-primary">
        Chi tiết thông tin
      </h2>
      <form className="grid min-w-0 grid-cols-1 gap-gutter-md md:grid-cols-2">
        <Field label="Họ và tên">
          <input className={inputClass} defaultValue={userProfile.name} type="text" />
        </Field>
        <Field label="Ngày sinh">
          <input className={inputClass} defaultValue={userProfile.birthDate} type="date" />
        </Field>
        <Field label="Quốc tịch">
          <select className={inputClass} defaultValue={userProfile.nationality}>
            <option>Việt Nam</option>
            <option>Hoa Kỳ</option>
            <option>Nhật Bản</option>
          </select>
        </Field>
        <Field label="Số hộ chiếu/CCCD">
          <input className={inputClass} defaultValue={userProfile.identityNumber} type="text" />
        </Field>
        <div className="flex justify-end pt-4 md:col-span-2">
          <button
            className="rounded-lg bg-primary px-6 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            type="button"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    </Panel>
  );
}

function UpcomingTripCard() {
  return (
    <Panel className="border-l-4 border-l-secondary-container">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-stack-md">
        <h3 className="min-w-0 truncate font-title-lg text-title-lg text-primary">Chuyến đi sắp tới</h3>
        <span className="flex-none rounded bg-status-info/10 px-2 py-1 font-label-md text-xs uppercase text-status-info">Đã xác nhận</span>
      </div>
      <div className="mb-2 flex min-w-0 items-center gap-4">
        <span className="font-headline-md text-headline-md font-bold text-primary">SGN</span>
        <ArrowRight className="h-5 w-5 flex-none text-slate-gray" />
        <span className="font-headline-md text-headline-md font-bold text-primary">HAN</span>
      </div>
      <p className="mb-4 truncate font-body-sm text-body-sm text-slate-gray">Thứ 6, 24 Thg 11 • 08:30 AM</p>
      <Link
        className="flex h-10 w-full items-center justify-center rounded-lg bg-surface-container font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-high"
        to="/bookings/VJA8X9"
      >
        Xem chi tiết
      </Link>
    </Panel>
  );
}

function SavedPassengerCard() {
  return (
    <Panel className="flex flex-col items-center justify-center border-dashed text-center">
      <UserPlus className="mb-2 h-10 w-10 text-slate-gray" />
      <h3 className="mb-1 font-title-lg text-title-lg text-primary">Thêm hành khách</h3>
      <p className="mb-4 font-body-sm text-body-sm text-slate-gray">Lưu thông tin gia đình để đặt vé nhanh hơn.</p>
      <button className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:underline">
        Thêm mới
        <Plus className="h-4 w-4" />
      </button>
    </Panel>
  );
}

export default function UserProfileFeature() {
  return (
    <main className="min-w-0 flex-grow bg-surface-container">
      <div className="mx-auto grid w-full max-w-7xl min-w-0 grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-stack-md lg:col-span-9">
          <ProfileSummaryCard />
          <ProfileForm />
          <div className="grid min-w-0 grid-cols-1 gap-gutter-md md:grid-cols-2">
            <UpcomingTripCard />
            <SavedPassengerCard />
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-stack-md lg:col-span-3">
          <LoyaltyCard />
          <ProfileNav />
        </aside>
      </div>
    </main>
  );
}
