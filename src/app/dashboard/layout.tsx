import { Sidebar } from "@/components/sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { AdminRouteGuard } from "@/components/admin-route-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <div className="admin-shell flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/90 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <DashboardBreadcrumb />
              <div className="inline-flex w-fit items-center rounded-md border border-emerald-900/15 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Admin tools
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
