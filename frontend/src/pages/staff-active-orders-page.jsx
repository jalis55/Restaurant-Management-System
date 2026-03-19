import { useEffect, useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAuth } from "@/hooks/use-auth";
import { useAsyncData } from "@/hooks/use-async-data";
import { useOrderEvents } from "@/hooks/use-order-events";
import { listActiveOrders, updateOrderStatus } from "@/lib/api";
import { formatOrderStatus, getNextOrderStatuses, getOrderActionButtonClass, getOrderTone } from "@/lib/order-utils";


function isActiveOrder(order) {
  return order.status !== "served" && order.status !== "cancelled";
}


function sortOrders(orders) {
  return [...orders].sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
}

function getWaiterNextStatuses(status) {
  if (status === "ready") {
    return ["served"];
  }

  return [];
}

function StaffActiveOrdersPage() {
  const { user } = useAuth();
  const { data: orders, error, isLoading, setData: setOrders } = useAsyncData(() => listActiveOrders());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const orderList = orders ?? [];

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const latestOrders = await listActiveOrders();
        setOrders(latestOrders);
      } catch {
        // Keep the current list when a background refresh fails.
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [setOrders]);

  useOrderEvents((event) => {
    if (!event?.order) {
      return;
    }

    setOrders((currentOrders) => {
      const existingOrders = currentOrders ?? [];
      const withoutCurrent = existingOrders.filter((order) => order.id !== event.order.id);

      if (!isActiveOrder(event.order)) {
        return withoutCurrent;
      }

      return sortOrders([event.order, ...withoutCurrent]);
    });
  });

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
      title="Active Orders"
      description="Follow the live order list, keep an eye on delays, and stay aligned with the kitchen queue."
      stats={[
        <StatCard key="open" label="Open now" value={String(orderList.length)} note="Current workload" />,
        <StatCard key="preparing" label="Preparing" value={String(orderList.filter((order) => order.status === "preparing").length)} note="In kitchen" />,
        <StatCard key="ready" label="Ready" value={String(orderList.filter((order) => order.status === "ready").length)} note="For pickup or serve" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!orderList.length} loadingLabel="Loading active orders...">
        <div className="grid gap-4">
          <Panel eyebrow="Live board" title="Active orders">
            <div className="space-y-3">
              {orderList.map((order) => (
                <div key={order.id} className="rounded-2xl border border-black/6 p-4">
                  <QueueItem
                    title={`${order.order_number}${order.table_number ? ` · Table ${order.table_number}` : ""}`}
                    meta={`${order.order_type.replace("_", " ")} · ${order.items.length} line items`}
                    status={formatOrderStatus(order.status)}
                    tone={getOrderTone(order.status)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getWaiterNextStatuses(order.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className={getOrderActionButtonClass(nextStatus)}
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        type="button"
                      >
                        {busyId === order.id ? "Updating..." : formatOrderStatus(nextStatus)}
                      </button>
                    ))}
                    {order.status === "pending" && user?.role === "waiter" ? (
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Awaiting kitchen or manager confirmation</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { StaffActiveOrdersPage };
