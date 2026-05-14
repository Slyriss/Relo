import { EventNavbar } from "@/components/event-navbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function EventLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <>
      <EventNavbar eventId={params.id} />
      {children}
      <MobileBottomNav eventId={params.id} />
    </>
  );
}
