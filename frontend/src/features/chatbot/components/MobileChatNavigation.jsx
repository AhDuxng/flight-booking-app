import { Link } from "react-router-dom";
import { Bot, Plane, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Trợ lý", icon: Bot, to: "/chatbot", active: true },
  { label: "Chuyến bay", icon: Plane, to: "/" },
  { label: "Tài khoản", icon: UserRound, to: "/profile" },
];

export default function MobileChatNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-outline-variant bg-surface px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
      {items.map((item) => (
        <Link
          className={cn("flex min-w-16 flex-col items-center gap-1 text-xs", item.active ? "font-semibold text-primary" : "text-on-surface-variant")}
          key={item.to}
          to={item.to}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
