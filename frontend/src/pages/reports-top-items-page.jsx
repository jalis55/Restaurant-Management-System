import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { getTopItemsReport } from "@/lib/api";

function ReportsTopItemsPage() {
  const { data: items, error, isLoading } = useAsyncData(() => getTopItemsReport({ days: 30, limit: 10 }));
  const topItems = items ?? [];

  return (
    <PageShell
      eyebrow="Reports"
      title="Top Items Report"
      description="See which menu items are performing best and where demand is starting to fade."
      stats={[
        <StatCard key="leader" label="Top item" value={topItems[0]?.menu_item__name || "-"} note="Highest quantity sold" />,
        <StatCard key="qty" label="Units sold" value={String(topItems.reduce((sum, item) => sum + item.quantity_sold, 0))} note="Top 10 combined" />,
        <StatCard key="revenue" label="Revenue" value={`$${topItems.reduce((sum, item) => sum + Number(item.revenue), 0).toFixed(2)}`} note="Top items only" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!topItems.length} loadingLabel="Loading top items report...">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel eyebrow="Top sellers" title="Best-performing items">
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={item.menu_item__id} className="flex items-center gap-4 rounded-2xl border border-black/6 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-950">{item.menu_item__name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.quantity_sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-950">${item.revenue}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Last 30 days</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Highlights" title="Revenue leaders">
            <div className="space-y-3">
              {topItems.slice(0, 5).map((item) => (
                <QueueItem key={item.menu_item__id} title={item.menu_item__name} meta={`${item.quantity_sold} items sold`} status={`$${item.revenue}`} tone="blue" />
              ))}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { ReportsTopItemsPage };
