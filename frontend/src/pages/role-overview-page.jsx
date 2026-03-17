import { ArrowRight, DollarSign, ShieldCheck, TableProperties, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { getDashboardReport, listActiveOrders, listTodayReservations } from "@/lib/api";
import { getDefaultPathForRole } from "@/lib/navigation";

function RoleOverviewPage({ user }) {
  const role = user?.role ?? "staff";
  const nextPath = getDefaultPathForRole(role);
  const canManageUsers = role === "admin";
  const { data, error, isLoading } = useAsyncData(
    async () => {
      const [dashboard, activeOrders, todayReservations] = await Promise.all([
        getDashboardReport(),
        listActiveOrders(),
        listTodayReservations(),
      ]);

      return { activeOrders, dashboard, todayReservations };
    },
  );

  const dashboard = data?.dashboard;
  const activeOrders = data?.activeOrders ?? [];
  const todayReservations = data?.todayReservations ?? [];

  return (
    <PageShell
      eyebrow="Admin Panel"
      title="Dashboard"
      description="A control room for restaurant operations, service pace, and management visibility."
      actions={
        <>
          <Button asChild variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none">
            <Link to="/reports/revenue">View revenue</Link>
          </Button>
          <Button asChild className="h-11 rounded-xl bg-black px-5 text-sm text-white hover:bg-black/90">
            <Link to="/operations/orders">
              Open operations
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </>
      }
      stats={[
        <StatCard key="revenue" label="Revenue" value={`$${dashboard?.revenue ?? "0.00"}`} note="Report summary" />,
        <StatCard key="orders" label="Orders" value={String(dashboard?.orders ?? 0)} note="Total in report window" />,
        <StatCard key="reservations" label="Reservations today" value={String(dashboard?.reservations_today ?? 0)} note="Today's bookings" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} loadingLabel="Loading dashboard...">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <Panel eyebrow="Shift command" title="Everything important is one glance away." description="Owners and managers share this overview so they can spot pressure points in service, staffing, and revenue before the shift falls behind.">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric icon={DollarSign} label="Revenue" value={`$${dashboard?.revenue ?? "0.00"}`} tone="slate" />
                <MiniMetric icon={TableProperties} label="Open Orders" value={String(dashboard?.active_orders ?? 0)} tone="amber" />
                <MiniMetric icon={Users} label="Reservations Today" value={String(dashboard?.reservations_today ?? 0)} tone="blue" />
              </div>
            </Panel>

            <Panel eyebrow="Right now" title="Operational hotspots">
              <div className="space-y-3">
                {activeOrders.slice(0, 3).map((order) => (
                  <QueueItem
                    key={order.id}
                    title={order.order_number}
                    meta={`${order.order_type.replace("_", " ")} · ${order.items.length} line items`}
                    status={order.status}
                    tone="amber"
                  />
                ))}
                {todayReservations.slice(0, 2).map((reservation) => (
                  <QueueItem
                    key={reservation.id}
                    title={reservation.guest_name}
                    meta={`${reservation.party_size} guests · Table ${reservation.table_number || "-"}`}
                    status={reservation.status}
                    tone="blue"
                  />
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel eyebrow="Permissions" title="Workspace access">
              <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
                <p className="flex items-center gap-2 text-base font-semibold text-slate-950">
                  <ShieldCheck className="size-4" />
                  {canManageUsers ? "Owner controls enabled" : "Manager controls enabled"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {canManageUsers
                    ? "You have full access across operations, menu, reports, settings, and staff account control."
                    : "You have the full admin workspace, but destructive user deletion should remain disabled."}
                </p>
              </div>
            </Panel>

            <Panel eyebrow="Momentum" title="Live summary">
              <div className="grid gap-3">
                <MiniMetric icon={TrendingUp} label="Orders" value={String(dashboard?.orders ?? 0)} tone="lime" />
                <MiniMetric icon={Users} label="Active Orders" value={String(dashboard?.active_orders ?? 0)} tone="blue" />
              </div>
            </Panel>

            <Button asChild variant="outline" className="h-11 w-full rounded-xl border-black/10 bg-white px-4 text-sm shadow-none">
              <Link to={nextPath}>Go to my workspace</Link>
            </Button>
          </div>
        </div>
      </DataState>
    </PageShell>
  );
}

export { RoleOverviewPage };
