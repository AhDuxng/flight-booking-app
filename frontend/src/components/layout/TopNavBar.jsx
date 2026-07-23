import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, Bot, CheckCheck, LogIn, LogOut, Menu, User, X } from "lucide-react";
import logo from "@/assets/images/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/features/auth/authService";
import { notificationService } from "@/features/notifications/notificationService";
import { cn } from "@/lib/utils";
import { authStore } from "@/store/authStore";
import { notificationStore, useNotificationStore } from "@/store/notificationStore";

const navItems = [
  { to: "/", label: "Chuyến bay" },
  { to: "/promotions", label: "Khuyến mãi" },
  { to: "/my-bookings", label: "Đặt chỗ của tôi" },
  { to: "/support", label: "Hỗ trợ" },
  { to: "/chatbot", label: "Trợ lý AI" },
];

export default function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth, isAuthenticated, updateUser, user } = useAuth();
  const { isOpen: isNotificationsOpen, unreadCount } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    notificationStore.close();
  }, [location.pathname]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        notificationStore.setUnreadCount(0);
        return;
      }

      try {
        const response = await notificationService.getAll({ limit: 10 });
        const items = response.data ?? [];
        setNotifications(items);
        notificationStore.setUnreadCount(items.filter((item) => !item.read_at).length);
      } catch {
        setNotifications([]);
        notificationStore.setUnreadCount(0);
      }
    };

    loadNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    const syncProfileAvatar = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const response = await authService.getMe();
        const currentUser = authStore.getState().user;
        updateUser({
          ...currentUser,
          avatarUrl: response.data.avatar_url ?? null,
          fullName: response.data.full_name ?? currentUser?.fullName,
        });
      } catch {
        return;
      }
    };

    syncProfileAvatar();
  }, [isAuthenticated, updateUser]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      clearAuth();
      setIsMobileMenuOpen(false);
      navigate("/");
      return;
    }

    clearAuth();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-surface shadow-sm transition-colors duration-300 dark:bg-deep-navy">
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
        <div className="hidden h-full items-center gap-6 lg:flex">
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
        <div className="relative flex items-center gap-1 sm:gap-2">
          <button
            aria-expanded={isNotificationsOpen}
            aria-label="Thông báo"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-variant dark:text-inverse-primary"
            onClick={notificationStore.toggle}
            type="button"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {isAuthenticated ? (
            <>
              <Link
                aria-label={`Hồ sơ của ${user?.fullName || "bạn"}`}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-primary-container"
                to="/profile"
              >
                {user?.avatarUrl ? (
                  <img
                    alt="Ảnh đại diện người dùng"
                    className="h-full w-full object-cover"
                    height="36"
                    src={user.avatarUrl}
                    width="36"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </Link>
              <button
                aria-label="Đăng xuất"
                className="hidden h-10 items-center justify-center rounded-lg px-2 text-status-error transition-colors hover:bg-error-container/30 sm:flex"
                onClick={handleLogout}
                title="Đăng xuất"
                type="button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container sm:flex"
              to="/login"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}

          <button
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-variant dark:text-inverse-primary lg:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {isNotificationsOpen ? (
            <NotificationPanel
              notifications={notifications}
              onClose={notificationStore.close}
              onMarkRead={async (notification) => {
                if (!notification.read_at) {
                  try {
                    const response = await notificationService.markRead(notification.id);
                    setNotifications((items) =>
                      items.map((item) => (item.id === notification.id ? response.data : item)),
                    );
                    notificationStore.setUnreadCount(
                      Math.max(0, notificationStore.getState().unreadCount - 1),
                    );
                  } catch {
                    return;
                  }
                }
                notificationStore.close();
              }}
              onMarkAllRead={async () => {
                try {
                  await notificationService.markAllRead();
                  const readAt = new Date().toISOString();
                  setNotifications((items) =>
                    items.map((item) => ({ ...item, read_at: item.read_at ?? readAt })),
                  );
                  notificationStore.markAllRead();
                } catch {
                  return;
                }
              }}
            />
          ) : null}
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-outline-variant bg-surface px-container-padding py-3 shadow-lg dark:bg-deep-navy lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-label-md font-medium",
                    isActive
                      ? "bg-primary-fixed text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary dark:text-surface-variant",
                  )
                }
                end={item.to === "/"}
                key={item.to}
                to={item.to}
              >
                {item.to === "/chatbot" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4" />
                )}
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-label-md font-medium text-status-error hover:bg-error-container/40"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            ) : (
              <Link
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-label-md font-medium text-primary hover:bg-primary-fixed sm:hidden"
                to="/login"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

function NotificationPanel({ notifications, onClose, onMarkAllRead, onMarkRead }) {
  return (
    <div className="absolute right-10 top-12 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xl sm:right-0">
      <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <div>
          <p className="text-label-md font-semibold text-primary">Thông báo</p>
          <p className="text-xs text-on-surface-variant">Cập nhật hành trình gần nhất</p>
        </div>
        <button
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          onClick={onMarkAllRead}
          type="button"
        >
          <CheckCheck className="h-4 w-4" />
          Đã đọc
        </button>
      </div>
      <div className="divide-y divide-outline-variant">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={onMarkRead}
              time={new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(notification.created_at))}
            />
          ))
        ) : (
          <div className="px-4 py-6 text-center text-body-sm text-on-surface-variant">
            Chưa có thông báo.
          </div>
        )}
      </div>
      <Link
        className="block px-4 py-3 text-center text-body-sm font-semibold text-primary hover:bg-surface-container"
        onClick={onClose}
        to="/my-bookings"
      >
        Xem đặt chỗ của tôi
      </Link>
    </div>
  );
}

function NotificationItem({ notification, time, onOpen }) {
  const target = notification.payload?.bookingId
    ? `/bookings/${notification.payload.bookingId}`
    : notification.payload?.flightId
      ? `/flights/${notification.payload.flightId}`
      : "/my-bookings";

  return (
    <Link
      className="flex gap-3 px-4 py-3 hover:bg-surface-container"
      onClick={() => onOpen(notification)}
      to={target}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          !notification.read_at ? "bg-status-info" : "bg-outline-variant",
        )}
      />
      <div className="min-w-0">
        <p className="text-label-md text-on-surface">{notification.title}</p>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">{notification.body}</p>
        <p className="mt-1 text-xs text-on-surface-variant">{time}</p>
      </div>
    </Link>
  );
}
