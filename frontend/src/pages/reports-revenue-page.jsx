import { DollarSign, ReceiptText, TrendingUp } from "lucide-react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { getRevenueReport } from "@/lib/api";
import { cn } from "@/lib/utils";

function ReportsRevenuePage() {
  const { data: rows, error, isLoading } = useAsyncData(() => getRevenueReport({ days: 30 }));
  const revenueRows = rows ?? [];
  const totalRevenue = revenueRows.reduce((sum, row) => sum + Number(row.revenue), 0);
  const totalOrders = revenueRows.reduce((sum, row) => sum + row.orders, 0);
  const averageCheck = totalOrders ? (totalRevenue / totalOrders).toFixed(2) : "0.00";

  return (
    <PageShell
      eyebrow="Reports"
      title="Revenue Report"
      description="Follow daily revenue movement, compare trends, and spot slow shifts before they stack up."
      stats={[
        <StatCard key="sales" label="30-day sales" value={`$${totalRevenue.toFixed(2)}`} note="Served orders only" />,
        <StatCard key="orders" label="Orders" value={String(totalOrders)} note="Included in report" />,
        <StatCard key="avg" label="Avg check" value={`$${averageCheck}`} note="Revenue per served order" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!revenueRows.length} loadingLabel="Loading revenue report...">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel eyebrow="Revenue" title="Daily performance">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} tone="slate" />
              <MiniMetric icon={TrendingUp} label="Report Days" value="30" tone="lime" />
              <MiniMetric icon={ReceiptText} label="Avg Check" value={`$${averageCheck}`} tone="blue" />
            </div>

            <div className="mt-6 rounded-[24px] bg-[#f7f7f4] p-5">
              <div className="flex items-end gap-3">
                {revenueRows.slice(-7).map((row, index) => {
                  const height = Math.max(20, Number(row.revenue) / 4);

                  return (
                    <div key={row.day} className="flex-1">
                      <div className={cn("rounded-t-2xl", index === revenueRows.slice(-7).length - 1 ? "bg-lime-400" : "bg-slate-950/85")} style={{ height: `${height}px` }} />
                      <p className="mt-2 text-center text-xs text-slate-400">{new Date(row.day).toLocaleDateString([], { month: "short", day: "numeric" })}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Recent days" title="Revenue timeline">
            <div className="space-y-3">
              {revenueRows.slice(-5).reverse().map((row) => (
                <QueueItem
                  key={row.day}
                  title={new Date(row.day).toLocaleDateString([], { month: "long", day: "numeric" })}
                  meta={`${row.orders} served orders`}
                  status={`$${row.revenue}`}
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

export { ReportsRevenuePage };
