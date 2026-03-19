import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, StatCard } from "@/components/section-page-ui";
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

function OperationsBillingDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { data: orders, error, isLoading, setData: setOrders } = useAsyncData(() => listOrders());
  const { data: billingSettings, error: billingSettingsError, isLoading: isBillingSettingsLoading } = useAsyncData(() => getBillingSettings());
  const [form, setForm] = useState(DEFAULT_FORM);
  const [initializedOrderId, setInitializedOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const order = useMemo(() => {
    const orderList = orders ?? [];
    return orderList.find((item) => String(item.id) === String(orderId)) ?? null;
  }, [orders, orderId]);

  useEffect(() => {
    if (!order) {
      return;
    }

    if (String(initializedOrderId) === String(order.id)) {
      return;
    }

    setForm(createFormState(order));
    setInitializedOrderId(order.id);
  }, [initializedOrderId, order]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const latestOrders = await listOrders();
        setOrders(sortOrders(latestOrders));
      } catch {
        // Keep the current billing detail if a background refresh fails.
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
      const withoutCurrent = existingOrders.filter((item) => item.id !== event.order.id);
      return sortOrders([event.order, ...withoutCurrent]);
    });
  });

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => {
      if (name === "discount_type") {
        let nextDiscountValue = currentForm.discount_value;

        if (value === "none") {
          nextDiscountValue = "0.00";
        } else if (currentForm.discount_value === "0.00") {
          nextDiscountValue = "";
        }

        return {
          ...currentForm,
          discount_type: value,
          discount_value: nextDiscountValue,
        };
      }

      return {
        ...currentForm,
        [name]: value,
      };
    });
  }

  async function handleBill() {
    if (!order) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const updatedOrder = await billOrder(order.id, {
        discount_type: form.discount_type,
        discount_value: form.discount_type === "none" ? "0.00" : form.discount_value,
      });

      setOrders((currentOrders) => (currentOrders ?? []).map((item) => (item.id === order.id ? updatedOrder : item)));
      setForm(createFormState(updatedOrder));
      navigate("/operations/billing", { replace: true });
    } catch (actionError) {
      setMessage(actionError?.data?.detail || actionError.message || "Unable to save billing.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const preview = order ? getPreviewTotals(order, form, billingSettings) : null;
  const itemCount = order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const isDiscountDisabled = (form?.discount_type ?? DEFAULT_FORM.discount_type) === "none";
  const missingOrder = !isLoading && !error && !order;

  return (
    <PageShell
      eyebrow="Operations"
      title="Finalize Billing"
      description="Review the served order, confirm the bill summary, apply any manager discount, and finalize the bill."
      actions={
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          onClick={() => navigate("/operations/billing")}
          type="button"
        >
          <ArrowLeft className="size-4" />
          Back to billing
        </button>
      }
      stats={
        order && preview
          ? [
              <StatCard key="items" label="Items" value={String(itemCount)} note="Included in this bill" />,
              <StatCard key="subtotal" label="Subtotal" value={formatMoney(preview.subtotal)} note="Before charges" />,
              <StatCard key="total" label="Net total" value={formatMoney(preview.netAmount)} note="After discounts" />,
            ]
          : []
      }
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}

      <DataState
        isLoading={isLoading || isBillingSettingsLoading}
        error={error || billingSettingsError}
        empty={missingOrder}
        loadingLabel="Loading billing details..."
      >
        {order && preview ? (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel eyebrow="Bill" title={`${order.order_number}${order.table_number ? ` · Table ${order.table_number}` : ""}`} description={`${order.order_type.replace("_", " ")} · ${itemCount} items · Created by ${order.created_by_name || "Staff"}`}>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-black/8 bg-[#fafaf8] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{item.menu_item_name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Qty {item.quantity} · {item.service_station === "counter" ? "Counter" : "Kitchen"}
                        {Number(item.offer_percentage) > 0 ? ` · ${Number(item.offer_percentage).toFixed(0)}% offer` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(Number(item.unit_price) * Number(item.quantity))}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="space-y-4">
              <Panel eyebrow="Summary" title="Bill summary">
                <div className="space-y-3">
                  {[
                    ["Subtotal", formatMoney(preview.subtotal), "text-slate-900"],
                    [`Tax (${Number(billingSettings?.tax_percentage ?? 0).toFixed(2)}%)`, formatMoney(preview.taxAmount), "text-slate-900"],
                    [`Service (${Number(billingSettings?.service_charge_percentage ?? 0).toFixed(2)}%)`, formatMoney(preview.serviceChargeAmount), "text-slate-900"],
                    ["Menu offers", `- ${formatMoney(preview.menuOfferDiscountAmount)}`, "text-sky-900"],
                    ["Manager discount", `- ${formatMoney(preview.discountAmount)}`, "text-amber-900"],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-[#fafaf8] px-4 py-3 text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-semibold ${tone}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-4 text-white">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Net total</span>
                  <span className="text-2xl font-semibold">{formatMoney(preview.netAmount)}</span>
                </div>
              </Panel>

              <Panel eyebrow="Adjustment" title="Manager discount">
                <div className="grid gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Discount type</span>
                    <select
                      className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                      name="discount_type"
                      onChange={handleFormChange}
                      value={form.discount_type}
                    >
                      <option value="none">No discount</option>
                      <option value="amount">Direct amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Discount value</span>
                    <input
                      className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                      disabled={isDiscountDisabled}
                      min="0"
                      name="discount_value"
                      onChange={handleFormChange}
                      step="0.01"
                      type="number"
                      value={form.discount_value}
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-3">
                  <button
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isSubmitting}
                    onClick={handleBill}
                    type="button"
                  >
                    {isSubmitting ? "Saving..." : "Finalize bill"}
                  </button>
                  <button
                    className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    onClick={() => navigate("/operations/billing")}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </DataState>
    </PageShell>
  );
}

export { OperationsBillingDetailPage };
