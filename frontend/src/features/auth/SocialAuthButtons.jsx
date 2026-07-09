import { CircleUserRound, PlaneTakeoff } from "lucide-react";

const providers = [
  { label: "Google", icon: CircleUserRound, iconClassName: "text-on-surface" },
  { label: "Facebook", icon: PlaneTakeoff, iconClassName: "text-status-info" },
];

export default function SocialAuthButtons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {providers.map((provider) => {
        const Icon = provider.icon;

        return (
          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-label-md font-label-md text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
            key={provider.label}
            type="button"
          >
            <Icon className={`h-5 w-5 ${provider.iconClassName}`} />
            {provider.label}
          </button>
        );
      })}
    </div>
  );
}
