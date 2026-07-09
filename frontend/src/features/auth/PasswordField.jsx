import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function PasswordField({ autoComplete, id, label, name, onToggle, showPassword }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-label-md font-label-md text-on-surface">{label}</span> : null}
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
        <input
          autoComplete={autoComplete}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-11 text-body-md font-body-md text-on-surface shadow-sm outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20"
          id={id}
          name={name}
          placeholder="••••••••"
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          onClick={onToggle}
          type="button"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}
