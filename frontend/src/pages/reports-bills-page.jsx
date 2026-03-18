import { Download, ReceiptText, Tag, WalletCards } from "lucide-react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { getBillPdfUrl, getBillsReport } from "@/lib/api";

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function ReportsBillsPage() {
  const { data: rows, error, isLoading } = useAsyncData(() => getBillsReport({ days: 30 }));
  const billRows = rows ?? [];
  const totalBilled = billRows.reduce((sum, row) => sum + Number(row.final_amount), 0);
  const totalDiscount = billRows.reduce((sum, row) => sum + Number(row.discount_amount), 0);

  return (
    <PageShell
      eyebrow="Reports"
      title="Bills Report"
      description="Browse finalized bills, review discount activity, and download a detailed PDF copy for any billed order."
      stats={[
        <StatCard key="bills" label="Bills" value={String(billRows.length)} note="Last 30 days" />,
        <StatCard key="net" label="Net billed" value={formatMoney(totalBilled)} note="After discounts" />,
        <StatCard key="discount" label="Discounts" value={formatMoney(totalDiscount)} note="All applied reductions" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!billRows.length} loadingLabel="Loading bills report...">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel eyebrow="Bill archive" title="Downloadable bill records">
            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric icon={ReceiptText} label="Bills" value={String(billRows.length)} tone="slate" />
              <MiniMetric icon={WalletCards} label="Net billed" value={formatMoney(totalBilled)} tone="lime" />
              <MiniMetric icon={Tag} label="Discount given" value={formatMoney(totalDiscount)} tone="blue" />
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-black/6">
              <table className="min-w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                    <th className="px-5 py-4 font-medium">Bill</th>
                    <th className="px-5 py-4 font-medium">Billed</th>
                    <th className="px-5 py-4 font-medium">Discount</th>
                    <th className="px-5 py-4 font-medium">Final</th>
                    <th className="px-5 py-4 font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {billRows.map((row) => (
                    <tr key={row.id} className="border-b border-black/6 last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-[15px] font-semibold text-slate-950">{row.order_number}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {row.table_number ? `Table ${row.table_number}` : row.order_type.replace("_", " ")} · {row.item_count} items
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-950">
                        <p>{new Date(row.billed_at).toLocaleDateString()}</p>
                        <p className="mt-1 text-slate-500">{row.billed_by_name || "Manager"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-950">
                        <p className="capitalize">{row.discount_type}</p>
                        <p className="mt-1 text-slate-500">{formatMoney(row.discount_amount)}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">{formatMoney(row.final_amount)}</td>
                      <td className="px-5 py-4">
                        <a
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          href={getBillPdfUrl(row.id)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Download className="size-4" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel eyebrow="Recent bills" title="Latest finalized orders">
            <div className="space-y-3">
              {billRows.slice(0, 6).map((row) => (
                <QueueItem
                  key={row.id}
                  title={row.order_number}
                  meta={`${row.created_by_name} · Discount ${formatMoney(row.discount_amount)}`}
                  status={formatMoney(row.final_amount)}
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

export { ReportsBillsPage };
