import { CalendarDays } from "lucide-react";
import Input from "@/components/common/Input";

export default function DateDropdown({ label, defaultValue, disabled }) {
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <Input
        className="h-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        defaultValue={defaultValue}
        disabled={disabled}
        icon={CalendarDays}
        label={label}
        type="date"
      />
    </div>
  );
}
