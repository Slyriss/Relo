"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  visible: boolean;
  onToggle: () => void;
  locked?: boolean; // prevents toggling (e.g. name is always visible)
};

export function ProfileFieldToggle({ icon, label, children, visible, onToggle, locked }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3 transition hover:border-border/80">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
      <button
        onClick={locked ? undefined : onToggle}
        disabled={locked}
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
          locked && "cursor-default opacity-60",
          !locked && visible && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
          !locked && !visible && "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
        title={locked ? "Always visible" : visible ? "Visible to attendees — click to hide" : "Hidden — click to show"}
      >
        {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        {visible ? "Visible" : "Hidden"}
      </button>
    </div>
  );
}
