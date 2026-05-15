import Link from "next/link";
import { ArrowRight, CalendarCheck2, Network, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#08111f] text-white">
      <section
        className="relative flex min-h-screen items-center overflow-hidden bg-cover bg-center px-5 py-6 sm:px-8 lg:px-12"
        style={{ backgroundImage: "url('/relo-assets/landing-hero-mesh.png')" }}
      >
        <div className="absolute inset-0 bg-[#06101f]/70" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08111f] to-transparent" />

        <nav className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between sm:left-8 sm:right-8 lg:left-12 lg:right-12">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-300 text-[#08111f]">R</span>
            Relo
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/signup">Start workspace</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
              <Sparkles className="h-4 w-4 text-emerald-200" />
              Relationship intelligence for live events
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
              Relo
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">
              Give organizers a real control room for attendee import, live engagement, intro operations, and sponsor-ready reports.
              Give participants a separate event space built around who they should meet next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-300 text-[#08111f] hover:bg-emerald-200">
                <Link href="/signup">
                  Create workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
                <Link href="/login">Use demo accounts</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-white/14 bg-white/10 p-4 text-sm text-white/82 shadow-2xl backdrop-blur-md">
            {[
              ["Admin control", "Create events, import attendees, monitor check-ins, and facilitate requests."],
              ["Participant app", "A separate warm interface for matches, profiles, QR scan, and meeting logs."],
              ["Real systems", "Connected APIs, role-aware workspaces, persisted events, and explicit data boundaries."],
            ].map(([title, body], index) => {
              const Icon = index === 0 ? ShieldCheck : index === 1 ? Network : CalendarCheck2;
              return (
                <div key={title} className="flex gap-3 rounded-md border border-white/10 bg-[#06101f]/45 p-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 text-white/68">{body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-3 lg:px-12">
        {[
          ["Workspace isolation", "Admin and participant navigation, themes, and route guards are intentionally different."],
          ["Event operations", "Live people lookup, attendee imports, QR check-in, intro requests, and sponsor exports."],
          ["Attendee outcomes", "Ranked people to meet, meeting notes, profile visibility controls, and follow-up actions."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
