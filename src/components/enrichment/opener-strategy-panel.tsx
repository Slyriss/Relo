import { MessageCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OpenerStrategyPanel({
  strategies,
  likelyFocus,
  title = "Opener strategy",
  description = "Conversation angles grounded in the visible signals.",
  emptyMessage = "No opener strategy generated yet.",
  className,
}: {
  strategies: string[];
  likelyFocus?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {likelyFocus ? (
          <div className="mb-4 rounded-lg border bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Likely focus
            </div>
            <p className="text-sm leading-5">{likelyFocus}</p>
          </div>
        ) : null}

        {strategies.length ? (
          <ol className="space-y-3">
            {strategies.map((strategy, index) => (
              <li key={`${index}-${strategy}`} className="flex gap-3 rounded-lg border bg-background p-3">
                <Badge className="h-6 min-w-6 justify-center border-primary/30 px-2 text-primary">{index + 1}</Badge>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Opener angle
                  </div>
                  <p className="text-sm leading-5 text-muted-foreground">{strategy}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}

