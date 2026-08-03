import { CalendarDays } from "lucide-react";
import Input from "@/components/common/Input";

const today = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

export default function DateDropdown({ label, value, onChange, disabled }) {
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <Input
        className="h-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        disabled={disabled}
        icon={CalendarDays}
        label={label}
        min={today}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
