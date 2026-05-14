import { EventNavbar } from "@/components/event-navbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function EventLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="participant-shell min-h-screen bg-background">
      <EventNavbar eventId={id} />
      {children}
      <MobileBottomNav eventId={id} />
    </div>
  );
}
