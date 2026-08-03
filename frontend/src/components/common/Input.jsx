import { cn } from "@/lib/utils";

export default function Input({ className, icon: Icon, label, wrapperClassName, ...props }) {
  return (
    <label className={cn("block min-w-0", wrapperClassName)}>
      {label ? (
        <span className="mb-2 block text-label-md font-label-md text-on-surface">{label}</span>
      ) : null}
      <div className="relative min-w-0">
        {Icon ? (
          <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
        ) : null}
        <input
          className={cn(
            "h-11 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md font-body-md text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20",
            Icon && "pl-12",
            className,
          )}
          {...props}
        />
      </div>
    </label>
  );
}
