import { DollarSign, Percent, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { useOrderEvents } from "@/hooks/use-order-events";
import { getBillingSettings, listOrders } from "@/lib/api";

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function parseDiscountValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPreviewTotals(order, form, billingSettings) {
  const subtotal = Number(order.total_amount ?? 0);
  const taxPercentage = parseDiscountValue(billingSettings?.tax_percentage);
  const serviceChargePercentage = parseDiscountValue(billingSettings?.service_charge_percentage);
  const discountType = form?.discount_type ?? "none";
  const discountValue = parseDiscountValue(form?.discount_value);
  const taxAmount = (subtotal * taxPercentage) / 100;
  const serviceChargeAmount = (subtotal * serviceChargePercentage) / 100;
  const grossAmount = subtotal + taxAmount + serviceChargeAmount;
  const grossMultiplier = subtotal > 0 ? grossAmount / subtotal : 0;

  const menuOfferDiscountAmount = order.items.reduce((sum, item) => {
    const itemSubtotal = Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
    const itemOfferPercentage = Number(item.offer_percentage ?? 0);
    return sum + ((itemSubtotal * itemOfferPercentage) / 100) * grossMultiplier;
  }, 0);

  const baseAfterMenuOffers = Math.max(0, grossAmount - menuOfferDiscountAmount);

  let discountAmount = 0;

  if (discountType === "amount") {
    discountAmount = discountValue;
  } else if (discountType === "percentage") {
    discountAmount = (baseAfterMenuOffers * discountValue) / 100;
  }

  const clampedMenuOfferDiscount = Math.max(0, Math.min(grossAmount, menuOfferDiscountAmount));
  const clampedDiscount = Math.max(0, Math.min(baseAfterMenuOffers, discountAmount));
  const netAmount = Math.max(0, baseAfterMenuOffers - clampedDiscount);

  return {
    subtotal,
    taxAmount,
    serviceChargeAmount,
    menuOfferDiscountAmount: clampedMenuOfferDiscount,
    discountAmount: clampedDiscount,
    netAmount,
  };
}

function createFormState(order) {
  return {
    discount_type: order.discount_type ?? "none",
    discount_value: Number(order.discount_value ?? 0).toFixed(2),
  };
}

function sortOrders(orders) {
  return [...orders].sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
}

function BillingSummaryCard({ order, billingSettings, onFinalize }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const preview = getPreviewTotals(order, createFormState(order), billingSettings);

  return (
    <div className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Ready to bill</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {order.order_number}{order.table_number ? ` · Table ${order.table_number}` : ""}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {order.order_type.replace("_", " ")} · {itemCount} items · Created by {order.created_by_name || "Staff"}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
          Pending
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Subtotal</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.subtotal)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tax + service</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.taxAmount + preview.serviceChargeAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Menu offers</p>
          <p className="mt-1 text-lg font-semibold text-sky-900">- {formatMoney(preview.menuOfferDiscountAmount)}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">Estimated final</p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(preview.netAmount)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-black/6 bg-[#fcfcfa] px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Applied rules</p>
          <p className="mt-1 text-sm text-slate-600">
            Tax {Number(billingSettings?.tax_percentage ?? 0).toFixed(2)}% · Service {Number(billingSettings?.service_charge_percentage ?? 0).toFixed(2)}%
          </p>
        </div>
        <button
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={() => onFinalize(order)}
          type="button"
        >
          Finalize
        </button>
      </div>
    </div>
  );
}

function OperationsBillingPage() {
  const navigate = useNavigate();
  const { data: orders, error, isLoading, setData: setOrders } = useAsyncData(() => listOrders());
  const { data: billingSettings, error: billingSettingsError, isLoading: isBillingSettingsLoading } = useAsyncData(() => getBillingSettings());
  const [message, setMessage] = useState("");

  const servedOrders = useMemo(() => {
    const orderList = orders ?? [];
    return sortOrders(orderList.filter((order) => order.status === "served"));
  }, [orders]);

  const billedOrders = servedOrders.filter((order) => Boolean(order.billed_at));
  const unbilledOrders = servedOrders.filter((order) => !order.billed_at);
  const billedRevenue = billedOrders.reduce((sum, order) => sum + Number(order.final_amount), 0);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const latestOrders = await listOrders();
        setOrders(latestOrders);
      } catch {
        // Preserve the current billing queue if a background refresh fails.
      }
    }, 4000);

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
      return sortOrders([event.order, ...withoutCurrent]);
    });
  });

  return (
    <PageShell
      eyebrow="Operations"
      title="Billing"
      description="Managers can review served orders in summary first, then open a full finalize modal with tax, service, offers, and final discount details."
      stats={[
        <StatCard key="served" label="Served orders" value={String(servedOrders.length)} note="Waiting or completed billing" />,
        <StatCard key="pending" label="Pending billing" value={String(unbilledOrders.length)} note="Served but not finalized" />,
        <StatCard key="revenue" label="Billed revenue" value={formatMoney(billedRevenue)} note="Net total after discounts" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}

      <DataState
        isLoading={isLoading || isBillingSettingsLoading}
        error={error || billingSettingsError}
        empty={!servedOrders.length}
        loadingLabel="Loading billing queue..."
      >
        <div className="space-y-4">
          <Panel eyebrow="Billing rules" title="Checkout setup in effect" description="These rates are applied automatically to every finalized bill. Managers adjust only the final bill discount inside the modal.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric icon={ReceiptText} label="Ready to bill" value={String(unbilledOrders.length)} tone="amber" />
              <MiniMetric icon={DollarSign} label="Net billed" value={formatMoney(billedRevenue)} tone="lime" />
              <MiniMetric icon={Percent} label="Discounted" value={String(billedOrders.filter((order) => Number(order.discount_amount) > 0).length)} tone="blue" />
              <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Global rules</p>
                <p className="mt-3 text-sm text-slate-600">Tax {Number(billingSettings?.tax_percentage ?? 0).toFixed(2)}%</p>
                <p className="mt-1 text-sm text-slate-600">Service {Number(billingSettings?.service_charge_percentage ?? 0).toFixed(2)}%</p>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Billing queue" title="Served orders ready for manager checkout" description="Each card shows a short billing summary. Open the finalize modal only when you want the full bill details.">
            <div className="space-y-4">
              {unbilledOrders.map((order) => (
                <BillingSummaryCard
                  billingSettings={billingSettings}
                  key={order.id}
                  onFinalize={(activeOrder) => {
                    navigate(`/operations/billing/${activeOrder.id}`);
                  }}
                  order={order}
                />
              ))}
              {!unbilledOrders.length ? <p className="text-sm text-slate-500">No served orders are waiting for billing right now.</p> : null}
            </div>
          </Panel>

          <Panel eyebrow="Recent bills" title="Latest finalized orders">
            <div className="overflow-hidden rounded-[24px] border border-black/6">
              <table className="min-w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                    <th className="px-5 py-4 font-medium">Order</th>
                    <th className="px-5 py-4 font-medium">Base</th>
                    <th className="px-5 py-4 font-medium">Offers</th>
                    <th className="px-5 py-4 font-medium">Discount</th>
                    <th className="px-5 py-4 font-medium">Final</th>
                    <th className="px-5 py-4 font-medium">Billed by</th>
                  </tr>
                </thead>
                <tbody>
                  {billedOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-b border-black/6 last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-950">{order.order_number}</p>
                        <p className="mt-1 text-xs text-slate-500">{order.table_number ? `Table ${order.table_number}` : order.order_type.replace("_", " ")}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatMoney(order.total_amount)}
                        <p className="mt-1 text-xs text-slate-500">Tax {formatMoney(order.tax_amount)} · Service {formatMoney(order.service_charge_amount)}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-sky-900">{formatMoney(order.menu_offer_discount_amount)}</td>
                      <td className="px-5 py-4 text-sm font-medium text-amber-900">{formatMoney(order.discount_amount)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">{formatMoney(order.final_amount)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p>{order.billed_by_name || "Manager"}</p>
                        <p className="mt-1 text-xs text-slate-500">{order.billed_at ? new Date(order.billed_at).toLocaleString() : ""}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!billedOrders.length ? <p className="mt-4 text-sm text-slate-500">No orders have been billed yet this session.</p> : null}
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { OperationsBillingPage };
