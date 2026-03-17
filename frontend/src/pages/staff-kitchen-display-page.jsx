import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listKitchenOrders, updateOrderStatus } from "@/lib/api";
import { formatOrderStatus, getNextOrderStatuses, getOrderTone } from "@/lib/order-utils";

function StaffKitchenDisplayPage() {
  const { data: orders, error, isLoading, setData: setOrders } = useAsyncData(() => listKitchenOrders());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const orderList = orders ?? [];

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
      eyebrow="Staff Panel"
      title="Kitchen Display"
      description="Focus only on what needs to be cooked next, what is ready, and what is at risk of slowing service."
      stats={[
        <StatCard key="confirmed" label="Confirmed" value={String(orderList.filter((order) => order.status === "confirmed").length)} note="Ready to fire" />,
        <StatCard key="preparing" label="Preparing" value={String(orderList.filter((order) => order.status === "preparing").length)} note="In production" />,
        <StatCard key="ready" label="Ready" value={String(orderList.filter((order) => order.status === "ready").length)} note="Awaiting handoff" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!orderList.length} loadingLabel="Loading kitchen orders...">
        <Panel eyebrow="Kitchen" title="Production line">
          <div className="space-y-3">
            {orderList.map((order) => (
              <div key={order.id} className="rounded-2xl border border-black/6 p-4">
                <QueueItem
                  title={`${order.order_number}${order.table_number ? ` · Table ${order.table_number}` : ""}`}
                  meta={order.items.map((item) => `${item.menu_item_name} x${item.quantity}`).join(", ")}
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
      </DataState>
    </PageShell>
  );
}

export { StaffKitchenDisplayPage };
