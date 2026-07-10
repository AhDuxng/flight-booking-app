import { Link } from "react-router-dom";
import { Headphones, History, MessageCircle, RefreshCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { conversations } from "../chatbotData";
import IconButton from "./IconButton";

export default function HistorySidebar({ activeConversation, className, onClose, onNewConversation, onSelect }) {
  return (
    <aside className={cn("w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low", className)}>
      <div className="flex items-center justify-between border-b border-outline-variant px-container-padding py-4">
        <h2 className="text-title-lg font-title-lg text-primary">Lịch sử trò chuyện</h2>
        {onClose ? (
          <IconButton label="Đóng lịch sử" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        ) : null}
      </div>
      <div className="chat-scrollbar flex flex-1 flex-col overflow-y-auto p-container-padding">
        <button
          className="mb-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container"
          onClick={onNewConversation}
          type="button"
        >
          <MessageCircle className="h-4 w-4" />
          Cuộc trò chuyện mới
        </button>

        <div className="space-y-2">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversation;

            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-primary/10 bg-primary-fixed text-primary"
                    : "border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-primary",
                )}
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                type="button"
              >
                <History className="h-5 w-5 shrink-0" />
                <span className="min-w-0">
                  <span className={cn("block truncate text-body-sm", isActive && "font-semibold")}>{conversation.title}</span>
                  <span className="block text-xs opacity-75">{conversation.time}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto border-t border-outline-variant pt-5">
          <p className="mb-3 text-xs font-semibold uppercase text-on-surface-variant">Liên kết nhanh</p>
          <Link className="flex items-center gap-2 py-2 text-body-sm text-on-surface-variant hover:text-primary" to="/support">
            <Headphones className="h-4 w-4" />
            Trung tâm hỗ trợ
          </Link>
          <Link className="flex items-center gap-2 py-2 text-body-sm text-on-surface-variant hover:text-primary" to="/my-bookings">
            <RefreshCcw className="h-4 w-4" />
            Đổi chuyến và hoàn vé
          </Link>
        </div>
      </div>
    </aside>
  );
}
