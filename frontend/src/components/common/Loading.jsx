import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Loading({ className, label = "Đang tải" }) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] w-full items-center justify-center px-container-padding py-section-gap",
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-lg border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-primary shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-label-md font-label-md">{label}</span>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-container-high", className)} />;
}
