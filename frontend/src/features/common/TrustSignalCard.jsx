export default function TrustSignalCard({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center p-stack-md bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant">
      <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-secondary-container text-[32px]">
          {icon}
        </span>
      </div>
      <h3 className="text-title-lg font-title-lg text-primary mb-2">{title}</h3>
      <p className="text-body-md font-body-md text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}
