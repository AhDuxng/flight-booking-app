import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  failed: { icon: XCircle, className: "text-status-error", label: "Thanh toán thất bại" },
  paid: { icon: CheckCircle2, className: "text-status-success", label: "Đã thanh toán" },
  pending: { icon: Clock3, className: "text-status-warning", label: "Chờ thanh toán" },
};

export default function PaymentStatus({ status = "pending" }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-2 text-label-md font-label-md", config.className)}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}
