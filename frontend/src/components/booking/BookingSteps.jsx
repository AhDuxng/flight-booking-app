import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Chuyến bay", "Hành khách", "Ghế & dịch vụ", "Thanh toán"];
const progressClasses = {
  1: "w-0",
  2: "w-1/3",
  3: "w-2/3",
  4: "w-full",
};

export default function BookingSteps({ currentStep = 2 }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-0 right-0 top-4 h-px bg-outline-variant" />
        <div
          className={cn("absolute left-0 top-4 h-px bg-primary transition-all", progressClasses[currentStep])}
        />
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step} className="relative z-10 flex w-20 flex-col items-center gap-2 sm:w-28">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-label-md font-label-md",
                  isComplete && "border-primary bg-primary text-on-primary",
                  isCurrent && "border-primary bg-primary text-on-primary ring-4 ring-primary-fixed",
                  !isComplete && !isCurrent && "border-outline-variant bg-surface-container-highest text-on-surface-variant",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span
                className={cn(
                  "hidden text-center text-label-md font-label-md sm:block",
                  isCurrent ? "text-primary" : "text-on-surface-variant",
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
