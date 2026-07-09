import { cn } from "@/lib/utils";

export default function PaymentMethod({ description, icon: Icon, isSelected, onSelect, title }) {
  return (
    <button
      className={cn(
        "flex w-full min-w-0 items-center gap-4 rounded-lg border p-4 text-left transition-colors",
        isSelected ? "border-primary bg-sky-blue" : "border-surface-variant bg-surface-container-lowest hover:border-primary-fixed-dim",
      )}
      onClick={onSelect}
      type="button"
    >
      <span
        className={cn(
          "flex h-5 w-5 flex-none items-center justify-center rounded-full border-2",
          isSelected ? "border-primary bg-primary" : "border-outline-variant",
        )}
      >
        {isSelected ? <span className="h-2 w-2 rounded-full bg-on-primary" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-md font-label-md font-bold text-on-surface">{title}</span>
        <span className="block truncate text-body-sm font-body-sm text-on-surface-variant">{description}</span>
      </span>
      {Icon ? <Icon className="h-5 w-5 flex-none text-primary" /> : null}
    </button>
  );
}
