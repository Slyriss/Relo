import { ScanPanel } from "@/components/scan-panel";

export default function ScanPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Scan</h1>
        <p className="mt-1 text-muted-foreground">Confirm who you met and save the note even when offline.</p>
      </div>
      <ScanPanel eventId={params.id} />
    </main>
  );
}
