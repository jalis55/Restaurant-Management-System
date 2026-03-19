import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAsyncData } from "@/hooks/use-async-data";
import { addItemsToOrder, listMenuItems } from "@/lib/api";

const emptyLine = { menu_item: "", notes: "", quantity: 1 };

function OrderAdditionsModal({ open, order, onClose, onSaved }) {
  const { data: items } = useAsyncData(() => listMenuItems({ is_available: true }));
  const [form, setForm] = useState({ items: [{ ...emptyLine }], note: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const menuItems = items ?? [];

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({ items: [{ ...emptyLine }], note: "" });
    setMessage("");
    setIsSubmitting(false);
  }, [open, order?.id]);

  if (!open || !order) {
    return null;
  }

  function handleLineChange(index, field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function addLine() {
    setForm((currentForm) => ({ ...currentForm, items: [...currentForm.items, { ...emptyLine }] }));
  }

  function removeLine(index) {
    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.length === 1 ? [{ ...emptyLine }] : currentForm.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const payload = {
        note: form.note,
        items: form.items
          .filter((item) => item.menu_item)
          .map((item) => ({
            menu_item: Number(item.menu_item),
            quantity: Number(item.quantity),
            notes: item.notes,
          })),
      };

      if (!payload.items.length && !payload.note.trim()) {
        setMessage("Add at least one item or a new note entry.");
        setIsSubmitting(false);
        return;
      }

      const updatedOrder = await addItemsToOrder(order.id, payload);
      onSaved(updatedOrder);
      setForm({ items: [{ ...emptyLine }], note: "" });
      onClose();
    } catch (submitError) {
      setMessage(submitError?.data?.detail || submitError.message || "Unable to update the order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[32px] border border-black/8 bg-[#fbfbf8] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Additional order</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{order.order_number}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Append more menu items and add a fresh note entry without replacing the original order.</p>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {message ? <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}

          <div className="space-y-3">
            {form.items.map((line, index) => (
              <div key={`${index}-${line.menu_item}`} className="grid gap-3 rounded-2xl border border-black/6 bg-[#f7f7f4] p-4 sm:grid-cols-[1.5fr_0.5fr_1fr_auto]">
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
                <button
                  className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                  onClick={() => removeLine(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800" onClick={addLine} type="button">
            <Plus className="mr-2 inline size-4" />
            Add item line
          </button>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Additional note</span>
            <textarea className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="note" onChange={handleChange} value={form.note} />
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Add to order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { OrderAdditionsModal };
