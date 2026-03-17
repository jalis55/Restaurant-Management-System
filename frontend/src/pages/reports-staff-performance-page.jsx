import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { getStaffReport } from "@/lib/api";

function ReportsStaffPerformancePage() {
  const { data: rows, error, isLoading } = useAsyncData(() => getStaffReport({ days: 30 }));
  const staffRows = rows ?? [];

  return (
    <PageShell
      eyebrow="Reports"
      title="Staff Performance"
      description="Measure service output across the team and identify where coaching or support matters most."
      stats={[
        <StatCard key="staff" label="Staff in report" value={String(staffRows.length)} note="Active contributors" />,
        <StatCard key="orders" label="Orders handled" value={String(staffRows.reduce((sum, row) => sum + row.order_count, 0))} note="Last 30 days" />,
        <StatCard key="reservations" label="Reservations" value={String(staffRows.reduce((sum, row) => sum + row.reservation_count, 0))} note="Created by staff" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!staffRows.length} loadingLabel="Loading staff report...">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel eyebrow="Team output" title="Shift performance">
            <div className="overflow-hidden rounded-[24px] border border-black/6">
              <table className="min-w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                    <th className="px-5 py-4 font-medium">Staff</th>
                    <th className="px-5 py-4 font-medium">Orders</th>
                    <th className="px-5 py-4 font-medium">Reservations</th>
                    <th className="px-5 py-4 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {staffRows.map((row) => (
                    <tr key={row.created_by__id} className="border-b border-black/6 last:border-b-0">
                      <td className="px-5 py-4 text-[15px] font-medium text-slate-950">
                        {row.created_by__first_name || row.created_by__last_name
                          ? `${row.created_by__first_name} ${row.created_by__last_name}`.trim()
                          : row.created_by__username}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-950">{row.order_count}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{row.reservation_count}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">${row.revenue || "0.00"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel eyebrow="Top contributors" title="Leaderboard">
            <div className="space-y-3">
              {staffRows.slice(0, 5).map((row) => (
                <QueueItem
                  key={row.created_by__id}
                  title={row.created_by__username}
                  meta={`${row.order_count} orders · ${row.reservation_count} reservations`}
                  status={`$${row.revenue || "0.00"}`}
                  tone="lime"
                />
              ))}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { ReportsStaffPerformancePage };
