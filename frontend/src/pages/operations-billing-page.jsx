import { DollarSign, Percent, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { useOrderEvents } from "@/hooks/use-order-events";
import { billOrder, getBillingSettings, listOrders } from "@/lib/api";

const DEFAULT_FORM = {
  discount_type: "none",
  discount_value: "0.00",
};

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
    grossAmount,
    menuOfferDiscountAmount: clampedMenuOfferDiscount,
    discountAmount: clampedDiscount,
    baseAfterMenuOffers,
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

function BillingCard({ order, form, billingSettings, busyId, message, onChange, onSubmit }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isBusy = busyId === order.id;
  const isDiscountDisabled = (form?.discount_type ?? DEFAULT_FORM.discount_type) === "none";
  const preview = getPreviewTotals(order, form, billingSettings);
  const billingMeta = order.billed_at
    ? `Billed by ${order.billed_by_name || "Manager"} on ${new Date(order.billed_at).toLocaleString()}`
    : "Awaiting billing";

  return (
    <div className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
      <QueueItem
        title={`${order.order_number}${order.table_number ? ` · Table ${order.table_number}` : ""}`}
        meta={`${order.order_type.replace("_", " ")} · ${itemCount} items · ${billingMeta}`}
        status={order.billed_at ? "Billed" : "Ready to bill"}
        tone={order.billed_at ? "lime" : "amber"}
      />

      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Subtotal</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.subtotal)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tax</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.taxAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Service</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.serviceChargeAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Menu offers</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.menuOfferDiscountAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bill discount</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.discountAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7f4] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Net total preview</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(preview.netAmount)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
        <div className="rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tax rule</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{Number(billingSettings?.tax_percentage ?? 0).toFixed(2)}%</p>
        </div>

        <div className="rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Service charge rule</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{Number(billingSettings?.service_charge_percentage ?? 0).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Discount type</span>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
            name="discount_type"
            onChange={(event) => onChange(order.id, event)}
            value={form?.discount_type ?? DEFAULT_FORM.discount_type}
          >
            <option value="none">No discount</option>
            <option value="amount">Direct amount</option>
            <option value="percentage">Percentage</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Discount value</span>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
            disabled={isDiscountDisabled}
            min="0"
            name="discount_value"
            onChange={(event) => onChange(order.id, event)}
            step="0.01"
            type="number"
            value={form?.discount_value ?? DEFAULT_FORM.discount_value}
          />
        </label>

        <button
          className="mt-auto rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isBusy}
          onClick={() => onSubmit(order.id)}
          type="button"
        >
          {isBusy ? "Saving..." : "Finalize bill"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.items
          .filter((item) => Number(item.offer_percentage) > 0)
          .map((item) => (
            <span key={item.id} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-900">
              {item.menu_item_name} {Number(item.offer_percentage).toFixed(0)}% off
            </span>
          ))}
      </div>

      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}

function OperationsBillingPage() {
  const { data: orders, error, isLoading, setData: setOrders } = useAsyncData(() => listOrders());
  const { data: billingSettings, error: billingSettingsError, isLoading: isBillingSettingsLoading } = useAsyncData(() => getBillingSettings());
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [forms, setForms] = useState({});

  const servedOrders = useMemo(() => {
    const orderList = orders ?? [];
    return sortOrders(orderList.filter((order) => order.status === "served"));
  }, [orders]);

  const billedOrders = servedOrders.filter((order) => Boolean(order.billed_at));
  const unbilledOrders = servedOrders.filter((order) => !order.billed_at);
  const billedRevenue = billedOrders.reduce((sum, order) => sum + Number(order.final_amount), 0);

  useEffect(() => {
    if (!servedOrders.length) {
      return;
    }

    setForms((currentForms) => {
      const nextForms = { ...currentForms };

      servedOrders.forEach((order) => {
        if (!nextForms[order.id] || order.billed_at) {
          nextForms[order.id] = createFormState(order);
        }
      });

      return nextForms;
    });
  }, [servedOrders]);

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

function handleFormChange(orderId, event) {
  const { name, value } = event.target;

  setForms((currentForms) => {
    const current = currentForms[orderId] ?? DEFAULT_FORM;
    if (name === "discount_type") {
      let nextDiscountValue = current.discount_value;

      if (value === "none") {
        nextDiscountValue = "0.00";
      } else if (current.discount_value === "0.00") {
        nextDiscountValue = "";
      }

      return {
        ...currentForms,
        [orderId]: {
          ...current,
          discount_type: value,
          discount_value: nextDiscountValue,
        },
      };
    }

    return {
      ...currentForms,
      [orderId]: {
        ...current,
        [name]: value,
      },
    };
  });
  }

  async function handleBill(orderId) {
    const form = forms[orderId] ?? DEFAULT_FORM;
    setBusyId(orderId);
    setMessage("");

    try {
      const updatedOrder = await billOrder(orderId, {
        discount_type: form.discount_type,
        discount_value: form.discount_type === "none" ? "0.00" : form.discount_value,
      });

      setOrders((currentOrders) => (currentOrders ?? []).map((order) => (order.id === orderId ? updatedOrder : order)));
      setForms((currentForms) => ({
        ...currentForms,
        [orderId]: createFormState(updatedOrder),
      }));
      setMessage(`Billing saved for ${updatedOrder.order_number}.`);
    } catch (actionError) {
      setMessage(actionError?.data?.detail || actionError.message || "Unable to save billing.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Operations"
      title="Billing"
      description="Managers can finalize served orders here using the global tax and service charge setup, keep menu offers, then add an optional final bill discount."
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
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel eyebrow="Billing queue" title="Served orders ready for manager checkout" description="Pick a served order, review the global tax and service rules, choose how the final bill discount should work, and save the billed amount.">
            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric icon={ReceiptText} label="Ready to bill" value={String(unbilledOrders.length)} tone="amber" />
              <MiniMetric icon={DollarSign} label="Net billed" value={formatMoney(billedRevenue)} tone="lime" />
              <MiniMetric icon={Percent} label="Discounted" value={String(billedOrders.filter((order) => Number(order.discount_amount) > 0).length)} tone="blue" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Global tax</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{Number(billingSettings?.tax_percentage ?? 0).toFixed(2)}%</p>
              </div>
              <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Global service charge</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{Number(billingSettings?.service_charge_percentage ?? 0).toFixed(2)}%</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {unbilledOrders.map((order) => (
                <BillingCard
                  billingSettings={billingSettings}
                  key={order.id}
                  order={order}
                  form={forms[order.id]}
                  busyId={busyId}
                  message={busyId === order.id ? "Updating bill..." : ""}
                  onChange={handleFormChange}
                  onSubmit={handleBill}
                />
              ))}
              {!unbilledOrders.length ? <p className="text-sm text-slate-500">No served orders are waiting for billing right now.</p> : null}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel eyebrow="Summary" title="Recent billed orders">
              <div className="space-y-3">
                {billedOrders.slice(0, 6).map((order) => (
                  <QueueItem
                    key={order.id}
                    title={order.order_number}
                    meta={`Subtotal ${formatMoney(order.total_amount)} · Tax ${formatMoney(order.tax_amount)} · Service ${formatMoney(order.service_charge_amount)} · Offers ${formatMoney(order.menu_offer_discount_amount)} · Discount ${formatMoney(order.discount_amount)}`}
                    status={formatMoney(order.final_amount)}
                    tone="lime"
                  />
                ))}
                {!billedOrders.length ? <p className="text-sm text-slate-500">No orders have been billed yet this session.</p> : null}
              </div>
            </Panel>
          </div>
        </div>
      </DataState>
    </PageShell>
  );
}

export { OperationsBillingPage };
