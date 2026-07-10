import { Link } from "react-router-dom";
import { ArrowRight, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { recommendationItems } from "../chatbotData";

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
      {message.recommendations ? <RecommendationGrid /> : null}
    </article>
  );
}

function RecommendationGrid() {
  return (
    <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {recommendationItems.map((item) => (
        <article className="min-w-0 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm" key={item.title}>
          <div className="relative aspect-[16/8] overflow-hidden">
            <img alt={item.title} className="h-full w-full object-cover" height="240" src={item.image} width="480" />
            {item.badge ? (
              <span className="absolute right-2 top-2 rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container">
                {item.badge}
              </span>
            ) : null}
          </div>
          <div className="p-4">
            <h3 className="text-title-lg font-title-lg text-primary">{item.title}</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">{item.description}</p>
            <div className="mt-4 flex min-w-0 flex-wrap items-end justify-between gap-3">
              <div>
                {item.oldPrice ? (
                  <p className="text-xs text-on-surface-variant line-through">{item.oldPrice} VND</p>
                ) : (
                  <p className="text-xs text-on-surface-variant">Giá chỉ từ</p>
                )}
                <p className="text-title-lg font-bold text-primary">
                  {item.price} <span className="text-xs font-normal">VND</span>
                </p>
              </div>
              <Link
                className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg bg-secondary-container px-4 py-2 text-left text-body-sm font-semibold text-on-secondary-container transition-colors hover:bg-secondary-fixed-dim"
                to="/flights"
              >
                Xem chuyến bay
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
