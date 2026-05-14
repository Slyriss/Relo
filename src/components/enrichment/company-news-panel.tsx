import { Newspaper } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyNewsPanel({
  company,
  items,
  title = "Company news",
  emptyMessage = "No company news signals found yet.",
  className,
}: {
  company?: string;
  items: string[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {company ? `Recent context to check before approaching ${company}.` : "Recent context to check before outreach."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={`${index}-${item}`} className="flex gap-3 rounded-lg border bg-background p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Newspaper className="h-4 w-4" />
                </span>
                <p className="text-sm leading-5 text-muted-foreground">{item}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}

