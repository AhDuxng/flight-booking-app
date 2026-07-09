import { cn } from "@/lib/utils";

const badgeVariants = {
  cancelled: "border-status-error/20 bg-status-error/10 text-status-error",
  confirmed: "border-status-success/20 bg-status-success/10 text-status-success",
  default: "border-outline-variant bg-surface-container text-on-surface-variant",
  failed: "border-status-error/20 bg-status-error/10 text-status-error",
  paid: "border-status-success/20 bg-status-success/10 text-status-success",
  pending: "border-status-warning/30 bg-status-warning/10 text-[#B45309]",
  published: "border-status-success/20 bg-status-success/10 text-status-success",
  scheduled: "border-status-info/20 bg-status-info/10 text-status-info",
};

export default function StatusBadge({ children, status = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-label-md font-label-md uppercase",
        badgeVariants[status] ?? badgeVariants.default,
      )}
    >
      {children}
    </span>
  );
}
