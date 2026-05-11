import { Badge } from "@/components/ui/badge";

const statusClassName = {
  drafted: "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
  copied: "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-300",
  sent: "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-300",
  reminded: "border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-300"
};

export function FollowupStatusBadge({ status }: { status: "drafted" | "copied" | "sent" | "reminded" }) {
  return <Badge className={statusClassName[status]}>{status}</Badge>;
}
