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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fdfdf9_0%,_#f3f3ee_42%,_#ecece6_100%)] px-3 py-3 sm:px-4 sm:py-4 lg:p-6">
      <OrderNotificationCenter />
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1460px] overflow-hidden rounded-[36px] border border-black/5 bg-[#fbfbf8] shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
        <DashboardSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex min-w-0 flex-1 flex-col bg-[#f6f6f3] px-4 py-5 sm:px-6 sm:py-6">
          <MobileTopbar onOpen={() => setMobileOpen(true)} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
