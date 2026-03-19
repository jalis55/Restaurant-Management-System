import { ChevronRight, LogOut, UserRound, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getNavigationGroupsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;

  if (!item.to) {
    return (
      <button
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-white/42 transition hover:bg-white/6 hover:text-white/72"
        type="button"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
          <Icon className="size-4.5" />
        </span>
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-white/72 transition hover:bg-white/6 hover:text-white",
          isActive && "bg-[#c6ff2f] text-black shadow-[0_18px_38px_rgba(198,255,47,0.2)]",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4 transition",
              isActive && "border-black/8 bg-black/6 text-black",
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function DashboardSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigationGroups = getNavigationGroupsForRole(user?.role);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      setMobileOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-[#0b0f0a]/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[298px] flex-col bg-[#090b08] p-4 text-white transition-transform duration-300 lg:static lg:z-auto lg:w-[312px] lg:translate-x-0 lg:bg-transparent lg:p-3",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,#11150f_0%,#080a08_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,255,47,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[1rem] font-black tracking-tight text-[#c6ff2f]">KitchenSync v1.0</p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/35">
                {user?.role === "admin" || user?.role === "manager" ? "Admin panel" : "Staff panel"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl bg-white/6 text-white hover:bg-white/12 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" />
            </Button>

            <button
              className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white lg:flex"
              type="button"
            >
              <ChevronRight className="size-4.5" />
            </button>
          </div>


          <div className="sidebar-scroll relative mt-6 flex-1 space-y-5 overflow-y-auto pr-1.5">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/28">{group.label}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <SidebarLink key={item.path} item={{ ...item, to: item.path }} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-5 space-y-3">
            <button className="flex w-full items-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c6ff2f] text-black shadow-[0_8px_24px_rgba(198,255,47,0.22)]">
                <UserRound className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.first_name || user?.username || "Staff user"}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.18em] text-white/40">{user?.role || "staff"}</p>
              </div>
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/72 transition hover:bg-white/6 hover:text-white"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
                <LogOut className="size-4.5" />
              </span>
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export { DashboardSidebar };
