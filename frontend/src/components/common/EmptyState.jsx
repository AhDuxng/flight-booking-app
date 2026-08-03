import Button from "@/components/common/Button";

export default function EmptyState({ actionLabel, actionTo, description, icon: Icon, title }) {
  return (
    <div className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-lg text-center flight-card-shadow">
      {Icon ? <Icon className="mx-auto mb-4 h-10 w-10 text-outline" /> : null}
      <h2 className="mb-2 text-title-lg font-title-lg text-primary">{title}</h2>
      <p className="mx-auto mb-5 max-w-md text-body-md font-body-md text-on-surface-variant">
        {description}
      </p>
      {actionLabel && actionTo ? (
        <Button as="a" className="h-10 rounded px-4" href={actionTo}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
