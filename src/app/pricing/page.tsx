import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-normal">Pricing</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Event relationship intelligence priced for serious organizers, with founder-friendly pilots.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Pilot", "Growth", "Enterprise"].map((plan, index) => (
            <Card key={plan}>
              <CardContent className="p-6">
                <div className="font-semibold">{plan}</div>
                <div className="mt-4 text-3xl font-semibold">{index === 0 ? "$1k" : index === 1 ? "$4k" : "Custom"}</div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {index === 0 ? "One event, white-glove setup." : index === 1 ? "Recurring events and analytics." : "Security, SSO, and custom reporting."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
