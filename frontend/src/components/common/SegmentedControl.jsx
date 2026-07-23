import { cn } from "@/lib/utils";

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-surface-container p-1">
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            className={cn(
              "h-10 rounded-md px-4 text-label-md font-label-md transition-colors",
              isActive
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
