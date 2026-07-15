import { CalendarDays } from "lucide-react";
import Input from "@/components/common/Input";

export default function DateDropdown({ label, value, onChange, disabled }) {
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <Input
        className="h-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        disabled={disabled}
        icon={CalendarDays}
        label={label}
        min={new Date().toISOString().slice(0, 10)}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
