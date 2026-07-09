import { Link, NavLink } from "react-router-dom";
import { Bell } from "lucide-react";
import avatar from "@/assets/images/avatar.jpg";
import logo from "@/assets/images/logo.png";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Chuyến bay" },
  { to: "/promotions", label: "Khuyến mãi" },
  { to: "/my-bookings", label: "Đặt chỗ của tôi" },
  { to: "/support", label: "Hỗ trợ" },
];

export default function TopNavBar() {
  return (
    <nav className="bg-surface dark:bg-deep-navy shadow-sm fixed top-0 w-full z-50 transition-colors duration-300">
      <div className="flex justify-between items-center w-full px-container-padding h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-headline-md font-headline-md font-bold text-primary dark:text-inverse-primary hover:opacity-80 transition-opacity"
          >
            <img
              alt="VietFly Logo"
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
              height="48"
              src={logo}
              width="48"
            />
            <span>VietFly</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 h-full">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "h-full flex items-center text-label-md font-label-md transition-colors duration-200",
                  isActive
                    ? "text-primary dark:text-inverse-primary border-b-2 border-primary dark:border-inverse-primary pt-[2px]"
                    : "text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary",
                )
              }
              end={item.to === "/"}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            aria-label="Thông báo"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-variant dark:text-inverse-primary"
            type="button"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant"
            to="/profile"
          >
            <img
              alt="User profile avatar"
              className="w-full h-full object-cover"
              height="32"
              src={avatar}
              width="32"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}
