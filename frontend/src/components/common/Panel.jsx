import { cn } from "@/lib/utils";

export default function Panel({ children, className, icon: Icon, title }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)]",
        className,
      )}
    >
      {title ? (
        <div className="mb-stack-md flex items-center gap-2 border-b border-surface-container-high pb-4 text-primary">
          {Icon ? <Icon className="h-5 w-5 flex-none" /> : null}
          <h2 className="text-title-lg font-title-lg">{title}</h2>
        </div>
      ) : null}
      {children}
    </section>
  );
}
