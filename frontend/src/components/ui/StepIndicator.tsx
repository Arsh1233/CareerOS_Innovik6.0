import { Check } from "lucide-react";

interface Step {
  label: string;
  icon?: string;
}

interface Props {
  steps: Step[];
  current: number;
  accentColor?: string;
}

export default function StepIndicator({ steps, current, accentColor = "#4F7CFF" }: Props) {
  return (
    <div className="flex items-start justify-center">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5 w-[72px]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0"
                style={{
                  background: done
                    ? "#22A06B"
                    : active
                    ? accentColor
                    : "#F1F5F9",
                  color: done || active ? "#fff" : "#98A2B3",
                  boxShadow: active ? `0 0 0 4px ${accentColor}20` : "none",
                }}
              >
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span
                className="text-[10px] font-semibold text-center leading-tight transition-colors"
                style={{ color: active ? accentColor : done ? "#22A06B" : "#98A2B3" }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mt-4 h-0.5 w-8 mx-1 transition-all duration-500 shrink-0" style={{
                background: i < current ? "#22A06B" : "#E4E7EC",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
