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
      {children}
      <MobileBottomNav eventId={params.id} />
    </>
  );
}
