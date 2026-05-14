import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfidenceTone = "high" | "medium" | "low";

function toPercent(value: number) {
  const normalized = value > 1 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function confidenceTone(percent: number): ConfidenceTone {
  if (percent >= 80) return "high";
  if (percent >= 60) return "medium";
  return "low";
}

const toneClasses: Record<ConfidenceTone, { bar: string; badge: string; text: string }> = {
  high: {
    bar: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
  },
  medium: {
    bar: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    text: "text-amber-700",
  },
  low: {
    bar: "bg-slate-400",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    text: "text-slate-600",
  },
};

export function SourceConfidenceMeter({
  value,
  label = "Source confidence",
  size = "md",
  className,
}: {
  value: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const percent = toPercent(value);
  const tone = confidenceTone(percent);
  const Icon = percent >= 60 ? ShieldCheck : ShieldQuestion;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold",
            toneClasses[tone].badge
          )}
        >
          {percent}%
        </span>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2"
        )}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className={cn("h-full rounded-full", toneClasses[tone].bar)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

