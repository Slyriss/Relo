import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">
            R
          </span>
          Relo
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/dashboard/events" className="hover:text-foreground">
            Dashboard
          </Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
