import Link from "next/link";
import { ArrowRight, BarChart3, QrCode, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featureCards = [
  { title: "Recommended intros", body: "43 high-fit meetings suggested before check-in", icon: Sparkles },
  { title: "QR meeting capture", body: "Offline queue protects notes when venue wifi drops", icon: QrCode },
  { title: "Organizer analytics", body: "Live engagement, top connectors, follow-up rate", icon: BarChart3 }
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-b">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex rounded-full border px-3 py-1 text-sm text-muted-foreground">
                Relationship intelligence for real-world events
              </div>
              <h1 className="text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">
                Relo turns every event into measurable relationship ROI.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Know who to meet before the room opens, capture conversations offline during the event,
                and automate the follow-up loop after everyone leaves.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/dashboard/events">
                    Launch demo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/events/relo-summit-2026">Attendee mode</Link>
                </Button>
              </div>
            </div>
            <div className="grid content-end gap-4">
              {featureCards.map(({ title, body, icon: Icon }) => (
                <Card key={title} className="shadow-soft">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{title}</div>
                      <div className="text-sm text-muted-foreground">{body}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
