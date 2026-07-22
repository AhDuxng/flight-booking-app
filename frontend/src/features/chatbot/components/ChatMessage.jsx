import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex min-w-0 max-w-3xl flex-col", isUser ? "ml-auto max-w-[88%] items-end" : "w-full items-start")}>
      <div className={cn("mb-2 flex items-center gap-2", isUser && "flex-row-reverse")}>
        {!isUser ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-on-primary">
            <Bot className="h-4 w-4" />
          </span>
        ) : null}
        <span className="text-body-sm font-semibold text-primary">{isUser ? "Bạn" : "VietFly AI"}</span>
        <span className="text-xs text-on-surface-variant">{message.time}</span>
      </div>
      <div
        className={cn(
          "max-w-full break-words whitespace-pre-line rounded-lg px-4 py-3 text-body-md shadow-sm",
          isUser ? "rounded-tr-none bg-primary text-on-primary" : "rounded-tl-none border border-primary/5 bg-sky-blue text-on-surface",
        )}
      >
        {message.text}
      </div>
    </article>
  );
}
