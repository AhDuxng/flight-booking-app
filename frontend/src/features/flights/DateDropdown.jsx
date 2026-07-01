import { Input } from "@/components/ui/input";

export default function DateDropdown({ label, defaultValue, disabled }) {
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <label className="block text-label-md font-label-md text-on-surface-variant mb-base">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">
          calendar_today
        </span>
        <Input
          type="date"
          className="w-full pl-10 pr-3 py-2 text-body-md font-body-md text-on-surface focus-visible:ring-primary/20 focus-visible:border-primary transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          defaultValue={defaultValue}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
