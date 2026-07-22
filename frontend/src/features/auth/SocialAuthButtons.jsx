import { useState } from "react";
import { CircleUserRound, PlaneTakeoff } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/apiError";
import { authService } from "./authService";

const providers = [
  { label: "Google", icon: CircleUserRound, iconClassName: "text-on-surface" },
  { label: "Facebook", icon: PlaneTakeoff, iconClassName: "text-status-info" },
];

export default function SocialAuthButtons() {
  const [activeProvider, setActiveProvider] = useState("");

  const handleOAuth = async (provider) => {
    setActiveProvider(provider);
    try {
      const response = await authService.getOAuthUrl(provider.toLowerCase());
      window.location.assign(response.data.url);
    } catch (error) {
      toast.error(getErrorMessage(error, `Không thể đăng nhập bằng ${provider}.`));
      setActiveProvider("");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {providers.map((provider) => {
        const Icon = provider.icon;

        return (
          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-label-md font-label-md text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
            disabled={Boolean(activeProvider)}
            key={provider.label}
            onClick={() => handleOAuth(provider.label)}
            type="button"
          >
            <Icon className={`h-5 w-5 ${provider.iconClassName}`} />
            {activeProvider === provider.label ? "Đang chuyển..." : provider.label}
          </button>
        );
      })}
    </div>
  );
}
