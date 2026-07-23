import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BadgeDollarSign,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Plane,
  PlaneTakeoff,
  Users,
} from "lucide-react";
import logo from "@/assets/images/logo.png";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tổng quan", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Chuyến bay", to: "/admin/flights", icon: PlaneTakeoff },
  { label: "Đơn đặt vé", to: "/admin/bookings", icon: CalendarCheck },
  { label: "Thanh toán", to: "/admin/payments", icon: BadgeDollarSign },
  { label: "Người dùng", to: "/admin/users", icon: Users },
  { label: "Đánh giá", to: "/admin/reviews", icon: MessageSquareText },
  { label: "Sân bay", to: "/admin/airports", icon: MapPin },
  { label: "Hãng bay", to: "/admin/airlines", icon: Building2 },
  { label: "Tàu bay", to: "/admin/aircrafts", icon: Plane },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface-container text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-surface-container-high bg-surface-container-lowest lg:flex lg:flex-col">
        <Link className="flex h-16 items-center gap-3 border-b border-surface-container-high px-container-padding" to="/admin">
          <img alt="VietFly Logo" className="h-10 w-10 object-contain" height="40" src={logo} width="40" />
          <div>
            <p className="text-title-lg font-title-lg text-primary">VietFly</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant">Admin Console</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 p-stack-sm">
          {navItems.map((item) => (
            <AdminNavLink key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-surface-container-high bg-surface-container-lowest/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-container-padding">
            <Link className="flex items-center gap-2 text-title-lg font-title-lg text-primary lg:hidden" to="/admin">
              <img alt="VietFly Logo" className="h-9 w-9 object-contain" height="36" src={logo} width="36" />
              VietFly Admin
            </Link>
            <div className="hidden min-w-0 lg:block">
              <p className="text-label-md font-label-md text-secondary">Flight Booking Operations</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant">Quản trị lịch bay, đặt chỗ và thanh toán</p>
            </div>
            <Link
              className="rounded-lg bg-emerald-600 px-3 py-2 text-label-md font-label-md text-white shadow-sm transition-colors hover:bg-emerald-700"
              to="/"
            >
              Xem website
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-container-padding pb-3 lg:hidden">
            {navItems.map((item) => (
              <AdminNavLink compact key={item.to} {...item} />
            ))}
          </nav>
        </header>

        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-7xl px-container-padding py-stack-lg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({ compact = false, end = false, icon: Icon, label, to }) {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-label-md font-label-md transition-colors",
          compact && "flex-none border border-surface-container-high bg-surface-container-lowest",
          isActive ? "bg-emerald-600 text-white shadow-sm" : "text-on-surface-variant hover:bg-emerald-600 hover:text-white",
        )
      }
      end={end}
      to={to}
    >
      <Icon className="h-4 w-4 flex-none" />
      <span className="whitespace-nowrap">{label}</span>
    </NavLink>
  );
}
