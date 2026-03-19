import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { createOrder, listMenuItems, listTables } from "@/lib/api";

const emptyLine = { menu_item: "", notes: "", quantity: 1 };

function formatApiError(errorData) {
  if (!errorData) {
    return "Something went wrong.";
  }

  if (typeof errorData === "string") {
    return errorData;
  }

  if (Array.isArray(errorData)) {
    return errorData.join(" ");
  }

  return Object.entries(errorData)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : value}`)
    .join(" | ");
}

function StaffNewOrderPage() {
  const { data: items, error, isLoading } = useAsyncData(() => listMenuItems({ is_available: true }));
  const { data: tables } = useAsyncData(() => listTables());
  const [form, setForm] = useState({
    notes: "",
    order_type: "dine_in",
    table_number: "",
    items: [{ ...emptyLine }],
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const menuItems = items ?? [];
  const tableOptions = (tables ?? []).filter((table) => table.is_active);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleLineChange(index, field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addLine() {
    setForm((currentForm) => ({ ...currentForm, items: [...currentForm.items, { ...emptyLine }] }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const selectedItemsPayload = form.items
        .filter((item) => item.menu_item)
        .map((item) => ({
          menu_item: Number(item.menu_item),
          notes: item.notes,
          quantity: Number(item.quantity),
        }));

      if (!selectedItemsPayload.length) {
        setMessage("Select at least one menu item before creating the order.");
        setIsSubmitting(false);
        return;
      }

      if (form.order_type === "dine_in" && !form.table_number) {
        setMessage("Choose a table for dine-in orders.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        notes: form.notes,
        order_type: form.order_type,
        table_number: form.order_type === "dine_in" ? Number(form.table_number) : null,
        items: selectedItemsPayload,
      };
      const order = await createOrder(payload);
      setMessage(`Order ${order.order_number} created successfully.`);
      setForm({
        notes: "",
        order_type: "dine_in",
        table_number: "",
        items: [{ ...emptyLine }],
      });
    } catch (submitError) {
      setMessage(submitError?.data?.detail || formatApiError(submitError?.data) || submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedItems = form.items
    .filter((item) => item.menu_item)
    .map((line) => {
      const menuItem = menuItems.find((item) => item.id === Number(line.menu_item));
      return { ...line, menuItem };
    });

  const totalAmount = selectedItems.reduce((sum, line) => sum + Number(line.menuItem?.price || 0) * Number(line.quantity), 0);

  return (
    <PageShell
      eyebrow="Staff Panel"
      title="Create Order"
      description="Open a fresh order fast, capture table details, and hand it off to the service flow immediately."
      stats={[
        <StatCard key="type" label="Service type" value={form.order_type.replace("_", " ")} note="Current ticket" />,
        <StatCard key="items" label="Items" value={String(selectedItems.length)} note="Selected lines" />,
        <StatCard key="total" label="Estimated total" value={`$${totalAmount.toFixed(2)}`} note="Based on menu pricing" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!menuItems.length} loadingLabel="Loading menu items...">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel eyebrow="Front of house" title="Create a new order">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Order type</span>
                  <select className="w-full rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3 text-sm outline-none" name="order_type" onChange={handleFormChange} value={form.order_type}>
                    {["dine_in", "takeaway", "delivery"].map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Table</span>
                  <select
                    className="w-full rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3 text-sm outline-none"
                    disabled={form.order_type !== "dine_in"}
                    name="table_number"
                    onChange={handleFormChange}
                    value={form.table_number}
                  >
                    <option value="">Select table</option>
                    {tableOptions.map((table) => (
                      <option key={table.id} value={table.number}>
                        Table {table.number} · {table.location || "Dining room"} · {table.capacity} seats
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Order notes</span>
                <textarea className="min-h-28 w-full rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3 text-sm outline-none" name="notes" onChange={handleFormChange} value={form.notes} />
              </label>

              <div className="space-y-3">
                {form.items.map((line, index) => (
                  <div key={`${index}-${line.menu_item}`} className="grid gap-3 rounded-2xl border border-black/6 bg-[#f7f7f4] p-4 sm:grid-cols-[1.5fr_0.5fr_1fr]">
                    <select className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" onChange={(event) => handleLineChange(index, "menu_item", event.target.value)} value={line.menu_item}>
                      <option value="">Select item</option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.service_station === "counter" ? "Counter" : "Kitchen"}
                        </option>
                      ))}
                    </select>
                    <input className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" min="1" onChange={(event) => handleLineChange(index, "quantity", event.target.value)} type="number" value={line.quantity} />
                    <input className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" onChange={(event) => handleLineChange(index, "notes", event.target.value)} placeholder="Line notes" value={line.notes} />
                  </div>
                ))}
              </div>

              <button className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800" onClick={addLine} type="button">
                Add item
              </button>

              <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating order..." : "Create order"}
              </button>
            </form>
          </Panel>

          <Panel eyebrow="Order summary" title="Ticket preview">
            <div className="space-y-3">
              {selectedItems.map((line, index) => (
                <QueueItem
                  key={`${line.menu_item}-${index}`}
                  title={`${line.menuItem?.name || "Menu item"} x${line.quantity}`}
                  meta={`${line.menuItem?.service_station === "counter" ? "Counter serve" : "Kitchen serve"} · ${line.notes || "No line notes"}`}
                  status={`$${(Number(line.menuItem?.price || 0) * Number(line.quantity)).toFixed(2)}`}
                  tone={line.menuItem?.service_station === "counter" ? "blue" : "orange"}
                />
              ))}
              {!selectedItems.length ? <div className="rounded-2xl border border-black/6 p-4 text-sm text-slate-500">Select menu items to preview the order.</div> : null}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { StaffNewOrderPage };
