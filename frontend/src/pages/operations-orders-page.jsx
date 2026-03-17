import { CheckCheck, Clock3, ReceiptText } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listOrders, updateOrderStatus } from "@/lib/api";
import { formatOrderStatus, getNextOrderStatuses, getOrderTone } from "@/lib/order-utils";

function formatOrderMeta(order) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${order.order_type.replace("_", " ")} · ${itemCount} items · ${order.created_by_name || "Staff"} · ${order.total_amount}`;
}

function OperationsOrdersPage() {
  const { data: orders, error, isLoading, setData: setOrders } = useAsyncData(() => listOrders());
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const orderList = orders ?? [];
  const openOrders = orderList.filter((order) => !["served", "cancelled"].includes(order.status));
  const readyOrders = orderList.filter((order) => order.status === "ready");
  const atRiskOrders = orderList.filter((order) => ["pending", "confirmed"].includes(order.status));

  async function handleStatusChange(orderId, status) {
    setBusyId(orderId);
    setMessage("");

    try {
      const updatedOrder = await updateOrderStatus(orderId, status);
      setOrders((currentOrders) => currentOrders.map((order) => (order.id === orderId ? updatedOrder : order)));
      setMessage(`Order moved to ${formatOrderStatus(status)}.`);
    } catch (actionError) {
      setMessage(actionError?.data?.detail || actionError.message || "Unable to update the order.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Operations"
      title="Orders"
      description="Monitor in-flight orders, service timings, and fulfillment flow across the dining room and kitchen."
      stats={[
        <StatCard key="open" label="Open now" value={String(openOrders.length)} note="Across all channels" />,
        <StatCard key="risk" label="Need action" value={String(atRiskOrders.length)} note="Pending or confirmed" />,
        <StatCard key="ready" label="Ready" value={String(readyOrders.length)} note="Waiting on handoff" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!orderList.length} loadingLabel="Loading orders...">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel eyebrow="Live queue" title="Shift-wide order control" description="Track what is newly placed, what is slowing down, and which tickets need attention before they affect service.">
            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric icon={ReceiptText} label="Open Tickets" value={String(openOrders.length)} tone="slate" />
              <MiniMetric icon={Clock3} label="Pending Review" value={String(atRiskOrders.length)} tone="amber" />
              <MiniMetric icon={CheckCheck} label="Completed Today" value={String(orderList.filter((order) => order.status === "served").length)} tone="lime" />
            </div>

            <div className="mt-6 space-y-3">
              {orderList.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-2xl border border-black/6 p-4">
                  <QueueItem
                    title={`${order.order_number}${order.table_number ? ` · Table ${order.table_number}` : ""}`}
                    meta={formatOrderMeta(order)}
                    status={formatOrderStatus(order.status)}
                    tone={getOrderTone(order.status)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getNextOrderStatuses(order.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className="rounded-xl border border-black/8 bg-[#f7f7f4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-950 hover:text-white"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        type="button"
                      >
                        {busyId === order.id ? "Updating..." : formatOrderStatus(nextStatus)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel eyebrow="Watchlist" title="Service blockers">
              <div className="space-y-3">
                {atRiskOrders.slice(0, 4).map((order) => (
                  <QueueItem
                    key={order.id}
                    title={order.order_number}
                    meta={`${order.order_type.replace("_", " ")} · ${order.items.length} line items`}
                    status={formatOrderStatus(order.status)}
                    tone={getOrderTone(order.status)}
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

export { OperationsOrdersPage };
