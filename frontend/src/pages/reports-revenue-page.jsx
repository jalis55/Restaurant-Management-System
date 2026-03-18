import { DollarSign, ReceiptText, TrendingUp } from "lucide-react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { getRevenueReport } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function BarRevenueChart({ rows }) {
  const maxRevenue = Math.max(...rows.map((row) => Number(row.revenue)), 1);

  return (
    <div className="rounded-[26px] border border-black/6 bg-[#f8faf7] p-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Bar Chart</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">Daily billed revenue</h3>
        </div>
        <p className="text-sm text-slate-500">30-day range</p>
      </div>

      <div className="flex h-[280px] items-end gap-2 overflow-hidden">
        {rows.map((row, index) => {
          const height = Math.max(12, (Number(row.revenue) / maxRevenue) * 220);
          const isPeak = Number(row.revenue) === maxRevenue;

          return (
            <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              <span className="mb-2 text-[11px] font-medium text-slate-400">{formatMoney(row.revenue)}</span>
              <div
                className={cn(
                  "w-full rounded-t-[18px] transition-all",
                  isPeak ? "bg-[linear-gradient(180deg,#0f172a_0%,#84cc16_100%)]" : index % 2 === 0 ? "bg-slate-900" : "bg-slate-700",
                )}
                style={{ height }}
              />
              <span className="mt-3 text-[11px] text-slate-400">{formatShortDate(row.day)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineRevenueChart({ rows }) {
  const width = 760;
  const height = 260;
  const padding = 28;
  const maxRevenue = Math.max(...rows.map((row) => Number(row.revenue)), 1);
  const stepX = rows.length > 1 ? (width - padding * 2) / (rows.length - 1) : 0;

  const points = rows.map((row, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (Number(row.revenue) / maxRevenue) * (height - padding * 2);
    return { ...row, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = [`${padding},${height - padding}`, ...points.map((point) => `${point.x},${point.y}`), `${width - padding},${height - padding}`].join(" ");

  return (
    <div className="rounded-[26px] border border-black/6 bg-white p-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Line Chart</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">Revenue trend</h3>
        </div>
        <p className="text-sm text-slate-500">Daily movement over time</p>
      </div>

      <svg className="h-[280px] w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding - ratio * (height - padding * 2);
          return (
            <line
              key={ratio}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          );
        })}

        <polygon fill="rgba(132, 204, 22, 0.14)" points={areaPoints} />
        <polyline fill="none" points={polylinePoints} stroke="#0f172a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />

        {points.map((point) => (
          <g key={point.day}>
            <circle cx={point.x} cy={point.y} fill="#84cc16" r="5" stroke="#0f172a" strokeWidth="3" />
          </g>
        ))}
      </svg>

      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{formatShortDate(rows[0]?.day)}</span>
        <span>{formatShortDate(rows[Math.max(0, Math.floor(rows.length / 2))]?.day)}</span>
        <span>{formatShortDate(rows[rows.length - 1]?.day)}</span>
      </div>
    </div>
  );
}

function ReportsRevenuePage() {
  const { data: rows, error, isLoading } = useAsyncData(() => getRevenueReport({ days: 30 }));
  const revenueRows = rows ?? [];
  const totalRevenue = revenueRows.reduce((sum, row) => sum + Number(row.revenue), 0);
  const totalOrders = revenueRows.reduce((sum, row) => sum + row.orders, 0);
  const averageCheck = totalOrders ? totalRevenue / totalOrders : 0;
  const bestDay = revenueRows.reduce((best, row) => (Number(row.revenue) > Number(best?.revenue ?? 0) ? row : best), null);
  const latestSeven = revenueRows.slice(-7);

  return (
    <PageShell
      eyebrow="Reports"
      title="Revenue Report"
      description="Track billed revenue with clearer charts, day-by-day movement, and quick insight into your strongest sales periods."
      stats={[
        <StatCard key="sales" label="30-day sales" value={formatMoney(totalRevenue)} note="Billed orders only" />,
        <StatCard key="orders" label="Orders" value={String(totalOrders)} note="Included in report" />,
        <StatCard key="avg" label="Avg check" value={formatMoney(averageCheck)} note="Revenue per billed order" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!revenueRows.length} loadingLabel="Loading revenue report...">
        <div className="grid gap-4">
          <Panel
            eyebrow="Performance"
            title="Revenue command center"
            description="A cleaner view of how billed revenue is pacing across the last 30 days, with both daily totals and the broader trend line."
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <MiniMetric icon={DollarSign} label="Net Revenue" value={formatMoney(totalRevenue)} tone="slate" />
              <MiniMetric icon={ReceiptText} label="Billed Orders" value={String(totalOrders)} tone="blue" />
              <MiniMetric icon={TrendingUp} label="Best Day" value={bestDay ? formatMoney(bestDay.revenue) : "$0.00"} tone="lime" />
              <MiniMetric icon={DollarSign} label="Avg Check" value={formatMoney(averageCheck)} tone="amber" />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <BarRevenueChart rows={revenueRows} />
              <LineRevenueChart rows={revenueRows} />
            </div>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Panel eyebrow="Highlights" title="Recent billing activity">
              <div className="space-y-3">
                {latestSeven.slice().reverse().map((row) => (
                  <QueueItem
                    key={row.day}
                    title={new Date(row.day).toLocaleDateString([], { month: "long", day: "numeric" })}
                    meta={`${row.orders} billed orders`}
                    status={formatMoney(row.revenue)}
                    tone="lime"
                  />
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Summary" title="Revenue takeaways">
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/6 bg-[#f8fafc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Best day</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {bestDay ? new Date(bestDay.day).toLocaleDateString([], { month: "long", day: "numeric" }) : "-"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {bestDay ? `${formatMoney(bestDay.revenue)} across ${bestDay.orders} billed orders.` : "No billed revenue yet in the current window."}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/6 bg-[#0f172a] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Revenue posture</p>
                  <p className="mt-2 text-2xl font-semibold">{formatMoney(totalRevenue)}</p>
                  <p className="mt-2 text-sm text-white/70">
                    This view now reflects finalized billed totals after discounts, so it aligns with the actual bill reports.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </DataState>
    </PageShell>
  );
}

export { ReportsRevenuePage };
