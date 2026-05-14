import { Sidebar } from "@/components/sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center border-b bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
          <DashboardBreadcrumb />
        </header>
        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
