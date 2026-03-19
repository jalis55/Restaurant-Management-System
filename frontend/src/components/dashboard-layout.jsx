import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { OrderNotificationCenter } from "@/components/order-notification-center";

function MobileTopbar({ onOpen }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
      <div className="flex items-center gap-3">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={onOpen}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Workspace</p>
          <p className="text-sm font-medium text-slate-700">KitchenSync operations</p>
        </div>
      </div>

    </div>
  );
}

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fdfdf9_0%,_#f3f3ee_42%,_#ecece6_100%)]">
      <OrderNotificationCenter />
      <div className="flex h-screen w-full overflow-hidden bg-[#fbfbf8]">
        <DashboardSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f6f3]">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <MobileTopbar onOpen={() => setMobileOpen(true)} />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
