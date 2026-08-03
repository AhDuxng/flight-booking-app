import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Select({ className, label, options, value, onChange }) {
  return (
    <label className="relative block w-full min-w-0 sm:w-auto">
      <span className="sr-only">{label}</span>
      <select
        className={cn(
          "h-10 w-full min-w-0 appearance-none rounded border border-outline-variant bg-surface-container-lowest px-4 pr-10 text-body-sm font-body-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary/20 sm:min-w-[160px]",
          className,
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
    </label>
  );
}
