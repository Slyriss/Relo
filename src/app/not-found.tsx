import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08111f] px-4 py-12 text-white">
      <div className="w-full max-w-xl">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-300 text-[#08111f]">R</span>
          Relo
        </Link>
        <p className="mt-12 text-sm font-medium uppercase tracking-wide text-emerald-200">Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">This Relo page is not available.</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-white/72">
          The link may be old, private to another workspace, or tied to an event invitation you do not have access to.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-emerald-300 text-[#08111f] hover:bg-emerald-200">
            <Link href="/">
              Go home <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
            <a href="mailto:support@relo.app">
              <LifeBuoy className="h-4 w-4" />
              Contact support
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
