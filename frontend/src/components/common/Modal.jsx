import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Modal({ children, className, isOpen, onClose, title }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-navy/50 px-container-padding py-stack-lg">
      <section className={cn("w-full max-w-lg rounded-lg bg-surface-container-lowest p-stack-md shadow-xl", className)}>
        <div className="mb-stack-md flex items-center justify-between gap-4 border-b border-outline-variant pb-3">
          <h2 className="text-title-lg font-title-lg text-primary">{title}</h2>
          <button
            aria-label="Đóng"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
