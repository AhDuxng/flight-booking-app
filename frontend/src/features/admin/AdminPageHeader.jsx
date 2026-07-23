export default function AdminPageHeader({
  action,
  description,
  eyebrow = "Quản trị VietFly",
  title,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-label-md font-label-md text-secondary">{eyebrow}</p>
        <h1 className="mt-1 text-headline-lg font-headline-lg text-primary">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-body-md font-body-md text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex flex-none">{action}</div> : null}
    </div>
  );
}
