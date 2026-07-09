import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-on-primary shadow-sm hover:bg-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container shadow-sm hover:bg-secondary-fixed-dim",
  warning: "bg-[#F97316] text-deep-navy font-bold hover:bg-[#EA580C]",
  outline: "border border-primary text-primary hover:bg-primary/5",
  ghost: "text-on-surface-variant hover:bg-surface-container",
};

const sizes = {
  sm: "h-10 px-4 text-label-md font-label-md",
  md: "h-11 px-4 text-label-md font-label-md",
  lg: "h-12 px-5 text-label-md font-label-md",
};

export default function Button({
  as: Component = "button",
  children,
  className,
  icon: Icon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}) {
  const componentProps = Component === "button" ? { type, ...props } : props;

  return (
    <Component
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...componentProps}
    >
      {Icon ? <Icon className="h-4 w-4 flex-none" /> : null}
      <span className="truncate">{children}</span>
    </Component>
  );
}
