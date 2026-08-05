import Input from "./Input";
import { formatCurrencyInput, normalizeCurrencyInput } from "@/lib/currencyInput";

export default function CurrencyInput({ onValueChange, value, ...props }) {
  return (
    <Input
      {...props}
      autoComplete="off"
      inputMode="numeric"
      onChange={(event) => onValueChange(normalizeCurrencyInput(event.target.value))}
      type="text"
      value={formatCurrencyInput(value)}
    />
  );
}
