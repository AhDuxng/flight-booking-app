import { TrendingUp } from "lucide-react";

export default function AdminStatCard({ label, trend, value }) {
  return (
    <article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-sm font-body-sm text-on-surface-variant">{label}</p>
          <p className="mt-2 text-headline-md font-headline-md text-primary">{value}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 px-2 py-1 text-label-md font-label-md text-status-success">
          <TrendingUp className="h-3.5 w-3.5" />
          {trend}
        </span>
      </div>
    </article>
  );
}
