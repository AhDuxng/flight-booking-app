import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-body-sm text-on-surface-variant" role="status">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-on-primary">
        <Bot className="h-4 w-4" />
      </div>
      <span>VietFly AI đang xử lý</span>
      <span aria-hidden="true" className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-outline" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-outline [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-outline [animation-delay:240ms]" />
      </span>
    </div>
  );
}
