import { Clock3, TableProperties, Users } from "lucide-react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listTables } from "@/lib/api";
import { cn } from "@/lib/utils";

function OperationsTablesPage() {
  const { data: tables, error, isLoading } = useAsyncData(() => listTables());
  const tableList = tables ?? [];
  const activeTables = tableList.filter((table) => table.is_active);
  const totalSeats = activeTables.reduce((sum, table) => sum + table.capacity, 0);

  return (
    <PageShell
      eyebrow="Operations"
      title="Tables"
      description="See room readiness, capacity usage, and which tables need the quickest turn-around."
      stats={[
        <StatCard key="tables" label="Active tables" value={String(activeTables.length)} note="Currently bookable" />,
        <StatCard key="capacity" label="Seat capacity" value={String(totalSeats)} note="Total active seats" />,
        <StatCard key="inactive" label="Inactive" value={String(tableList.length - activeTables.length)} note="Unavailable for booking" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!tableList.length} loadingLabel="Loading tables...">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel eyebrow="Dining room" title="Table readiness map">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tableList.map((table) => (
                <div key={table.id} className="rounded-[24px] border border-black/6 bg-[#f7f7f4] p-4">
                  <div className={cn("h-3 w-16 rounded-full", table.is_active ? "bg-lime-400" : "bg-red-400")} />
                  <p className="mt-5 text-lg font-semibold text-slate-950">Table {table.number}</p>
                  <p className="mt-2 text-sm text-slate-600">{table.location || "Dining room"}</p>
                  <p className="mt-2 text-sm text-slate-500">Capacity {table.capacity}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel eyebrow="Coverage" title="Capacity pulse">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <MiniMetric icon={TableProperties} label="Active Tables" value={String(activeTables.length)} tone="slate" />
                <MiniMetric icon={Clock3} label="Inactive" value={String(tableList.length - activeTables.length)} tone="amber" />
                <MiniMetric icon={Users} label="Seat Capacity" value={String(totalSeats)} tone="blue" />
              </div>
            </Panel>

            <Panel eyebrow="Attention" title="Table distribution">
              <div className="space-y-3">
                {activeTables.slice(0, 4).map((table) => (
                  <QueueItem
                    key={table.id}
                    title={`Table ${table.number}`}
                    meta={`${table.location || "Dining room"} · Capacity ${table.capacity}`}
                    status={table.is_active ? "Active" : "Inactive"}
                    tone={table.is_active ? "lime" : "red"}
                  />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </DataState>
    </PageShell>
  );
}

export { OperationsTablesPage };
