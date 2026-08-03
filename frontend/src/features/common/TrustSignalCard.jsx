export default function TrustSignalCard({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-md text-center shadow-sm">
      <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-secondary-container" />
      </div>
      <h3 className="text-title-lg font-title-lg text-primary mb-2">{title}</h3>
      <p className="text-body-md font-body-md text-on-surface-variant">{description}</p>
    </div>
  );
}
