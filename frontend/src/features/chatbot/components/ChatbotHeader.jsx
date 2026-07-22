import { Link } from "react-router-dom";
import { Bot, Headphones, Menu, MoreVertical, RefreshCcw, Trash2 } from "lucide-react";
import IconButton from "./IconButton";

export default function ChatbotHeader({ isMenuOpen, onDeleteConversation, onMenuToggle, onNewConversation, onOpenHistory }) {
  return (
    <header className="z-10 flex min-h-20 items-center justify-between border-b border-outline-variant bg-surface/90 px-4 py-3 backdrop-blur md:px-container-padding">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Mở lịch sử trò chuyện"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-container lg:hidden"
          onClick={onOpenHistory}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-title-lg font-title-lg text-primary sm:text-headline-md sm:font-headline-md">
            <span className="sm:hidden">VietFly AI</span>
            <span className="hidden sm:inline">VietFly AI Assistant</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-status-success" />
            <span className="truncate text-xs text-on-surface-variant sm:text-body-sm">Trợ lý thông tin chuyến bay</span>
          </div>
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-1">
        <IconButton label="Tạo cuộc trò chuyện mới" onClick={onNewConversation}>
          <RefreshCcw className="h-5 w-5" />
        </IconButton>
        <IconButton label="Tùy chọn" onClick={onMenuToggle}>
          <MoreVertical className="h-5 w-5" />
        </IconButton>
        {isMenuOpen ? (
          <div className="absolute right-0 top-12 z-20 w-52 rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-xl">
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
              onClick={onDeleteConversation}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Xóa hội thoại hiện tại
            </button>
            <Link
              className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
              onClick={onMenuToggle}
              to="/support"
            >
              <Headphones className="h-4 w-4" />
              Trung tâm hỗ trợ
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
