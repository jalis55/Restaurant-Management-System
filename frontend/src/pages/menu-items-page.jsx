import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/hooks/use-auth";
import { createMenuItem, deleteMenuItem, listCategories, listMenuItems, toggleMenuItemAvailability, updateMenuItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultForm = {
  calories: "",
  category: "",
  description: "",
  display_order: 0,
  image: "",
  is_available: true,
  is_featured: false,
  name: "",
  offer_percentage: "0.00",
  preparation_time: 15,
  price: "",
};

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

function MenuItemsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const { data: items, error, isLoading, setData: setItems } = useAsyncData(() => listMenuItems());
  const { data: categories } = useAsyncData(() => listCategories());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const itemList = items ?? [];
  const categoryList = categories ?? [];
  const availableCount = itemList.filter((item) => item.is_available).length;
  const featuredCount = itemList.filter((item) => item.is_featured).length;
  const offeredCount = itemList.filter((item) => Number(item.offer_percentage) > 0).length;

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: type === "checkbox" ? checked : value }));
  }

  function openCreateModal() {
    setEditingItemId(null);
    setForm({ ...defaultForm, category: categoryList[0]?.id ? String(categoryList[0].id) : "" });
    setModalMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItemId(item.id);
    setForm({
      calories: item.calories ?? "",
      category: String(item.category),
      description: item.description || "",
      display_order: item.display_order,
      image: item.image || "",
      is_available: item.is_available,
      is_featured: item.is_featured,
      name: item.name,
      offer_percentage: Number(item.offer_percentage ?? 0).toFixed(2),
      preparation_time: item.preparation_time,
      price: item.price,
    });
    setModalMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingItemId(null);
    setForm(defaultForm);
    setModalMessage("");
  }

  async function handleToggle(itemId) {
    setBusyId(itemId);
    setMessage("");

    try {
      const updatedItem = await toggleMenuItemAvailability(itemId);
      setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? updatedItem : item)));
      setMessage(`${updatedItem.name} availability updated.`);
    } catch (actionError) {
      setMessage(actionError?.data?.detail || actionError.message || "Unable to update item availability.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(itemId) {
    setBusyId(itemId);
    setMessage("");

    try {
      await deleteMenuItem(itemId);
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
      setMessage("Menu item deleted.");
    } catch (actionError) {
      setMessage(actionError?.data?.detail || formatApiError(actionError?.data) || actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setModalMessage("");

    const payload = {
      ...form,
      calories: form.calories ? Number(form.calories) : null,
      category: Number(form.category),
      display_order: Number(form.display_order),
      offer_percentage: form.offer_percentage,
      preparation_time: Number(form.preparation_time),
      price: form.price,
    };

    try {
      const savedItem = editingItemId
        ? await updateMenuItem(editingItemId, payload)
        : await createMenuItem(payload);

      setItems((currentItems) => {
        const existingItems = currentItems ?? [];
        const nextItems = editingItemId
          ? existingItems.map((item) => (item.id === editingItemId ? savedItem : item))
          : [...existingItems, savedItem];

        return [...nextItems].sort((left, right) => left.display_order - right.display_order || left.name.localeCompare(right.name));
      });

      setMessage(editingItemId ? "Menu item updated." : "Menu item created.");
      closeModal();
    } catch (submitError) {
      setModalMessage(submitError?.data?.detail || formatApiError(submitError?.data) || submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Menu"
      title="Menu Items"
      description="Manage item availability, pricing, prep details, and what the floor can currently sell."
      actions={
        canManage ? (
          <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" onClick={openCreateModal} type="button">
            <Plus className="size-4" />
            Add item
          </Button>
        ) : null
      }
      stats={[
        <StatCard key="total" label="Items" value={String(itemList.length)} note="Total menu records" />,
        <StatCard key="available" label="Available" value={String(availableCount)} note="Currently sellable" />,
        <StatCard key="featured" label="Featured" value={String(featuredCount)} note="Promoted items" />,
        <StatCard key="offers" label="With offer" value={String(offeredCount)} note="Discounted menu items" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!itemList.length} loadingLabel="Loading menu items...">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel eyebrow="Availability" title="Menu item control">
            <div className="overflow-hidden rounded-[24px] border border-black/6">
              <table className="min-w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                    <th className="px-5 py-4 font-medium">Item</th>
                    <th className="px-5 py-4 font-medium">Category</th>
                    <th className="px-5 py-4 font-medium">Price</th>
                    <th className="px-5 py-4 font-medium">Offer</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {itemList.map((item) => (
                    <tr key={item.id} className="border-b border-black/6 last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-[15px] font-medium text-slate-950">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.description || "No description"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{item.category_name}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{item.price}</td>
                      <td className="px-5 py-4">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", Number(item.offer_percentage) > 0 ? "bg-sky-100 text-sky-900" : "bg-slate-100 text-slate-600")}>
                          {Number(item.offer_percentage) > 0 ? `${Number(item.offer_percentage).toFixed(0)}% off` : "No offer"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.is_available ? "bg-lime-100 text-lime-900" : "bg-red-100 text-red-900")}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {canManage ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl border border-black/8 bg-[#f7f7f4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-950 hover:text-white"
                              disabled={busyId === item.id}
                              onClick={() => handleToggle(item.id)}
                              type="button"
                            >
                              {busyId === item.id ? "Updating..." : item.is_available ? "Disable" : "Enable"}
                            </button>
                            <button className="rounded-xl border border-black/8 bg-white p-2 text-slate-600" onClick={() => openEditModal(item)} type="button">
                              <Pencil className="size-4" />
                            </button>
                            <button
                              className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700"
                              disabled={busyId === item.id}
                              onClick={() => handleDelete(item.id)}
                              type="button"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Read only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel eyebrow="Highlights" title="Featured and unavailable">
            <div className="space-y-3">
              {itemList
                .filter((item) => item.is_featured || !item.is_available || Number(item.offer_percentage) > 0)
                .slice(0, 5)
                .map((item) => (
                  <QueueItem
                    key={item.id}
                    title={item.name}
                    meta={`${item.category_name} · Prep ${item.preparation_time} min${Number(item.offer_percentage) > 0 ? ` · ${Number(item.offer_percentage).toFixed(0)}% offer` : ""}`}
                    status={!item.is_available ? "Unavailable" : Number(item.offer_percentage) > 0 ? "Offer live" : "Featured"}
                    tone={!item.is_available ? "red" : Number(item.offer_percentage) > 0 ? "blue" : "lime"}
                  />
                ))}
            </div>
          </Panel>
        </div>
      </DataState>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[32px] border border-black/8 bg-[#fbfbf8] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.24)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  {editingItemId ? "Edit menu item" : "Create menu item"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {editingItemId ? "Update menu item" : "Add a new item"}
                </h2>
              </div>

              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:bg-slate-50" onClick={closeModal} type="button">
                <X className="size-5" />
              </button>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {modalMessage ? <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{modalMessage}</div> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                  <input className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="name" onChange={handleChange} required value={form.name} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
                  <select className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="category" onChange={handleChange} required value={form.category}>
                    <option value="">Select category</option>
                    {categoryList.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                <textarea className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="description" onChange={handleChange} value={form.description} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["price", "Price", "number"],
                  ["offer_percentage", "Offer %", "number"],
                  ["preparation_time", "Prep time", "number"],
                  ["calories", "Calories", "number"],
                  ["display_order", "Display order", "number"],
                ].map(([name, label, type]) => (
                  <label key={name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
                    <input
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                      min="0"
                      name={name}
                      onChange={handleChange}
                      required={name !== "calories"}
                      step={name === "price" || name === "offer_percentage" ? "0.01" : undefined}
                      type={type}
                      value={form[name]}
                    />
                  </label>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Image URL</span>
                <input className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="image" onChange={handleChange} value={form.image} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-700">
                  <input checked={form.is_available} name="is_available" onChange={handleChange} type="checkbox" />
                  Available
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-700">
                  <input checked={form.is_featured} name="is_featured" onChange={handleChange} type="checkbox" />
                  Featured
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none" onClick={closeModal} type="button">
                  Cancel
                </Button>
                <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingItemId ? "Update item" : "Create item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export { MenuItemsPage };
