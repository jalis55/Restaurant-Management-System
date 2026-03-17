import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/hooks/use-auth";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/api";

const defaultForm = {
  name: "",
  description: "",
  display_order: 0,
  is_active: true,
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

function MenuCategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const { data: categories, error, isLoading, setData: setCategories } = useAsyncData(() => listCategories());
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const categoryList = categories ?? [];

  function openCreateModal() {
    setEditingCategoryId(null);
    setForm(defaultForm);
    setModalMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategoryId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setModalMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCategoryId(null);
    setForm(defaultForm);
    setModalMessage("");
  }

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setModalMessage("");

    const payload = {
      ...form,
      display_order: Number(form.display_order),
    };

    try {
      const savedCategory = editingCategoryId
        ? await updateCategory(editingCategoryId, payload)
        : await createCategory(payload);

      setCategories((currentCategories) => {
        const existingCategories = currentCategories ?? [];
        const nextCategories = editingCategoryId
          ? existingCategories.map((category) => (category.id === editingCategoryId ? savedCategory : category))
          : [...existingCategories, savedCategory];

        return [...nextCategories].sort((left, right) => left.display_order - right.display_order || left.name.localeCompare(right.name));
      });

      setMessage(editingCategoryId ? "Category updated." : "Category created.");
      closeModal();
    } catch (submitError) {
      setModalMessage(submitError?.data?.detail || formatApiError(submitError?.data) || submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(categoryId) {
    setBusyId(categoryId);
    setMessage("");

    try {
      await deleteCategory(categoryId);
      setCategories((currentCategories) => currentCategories.filter((category) => category.id !== categoryId));
      setMessage("Category deleted.");
    } catch (actionError) {
      setMessage(actionError?.data?.detail || formatApiError(actionError?.data) || actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Menu"
      title="Menu Categories"
      description="Organize the structure of the menu so item groupings stay clean and fast to manage."
      actions={
        canManage ? (
          <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" onClick={openCreateModal} type="button">
            <Plus className="size-4" />
            Add category
          </Button>
        ) : null
      }
      stats={[
        <StatCard key="categories" label="Categories" value={String(categoryList.length)} note="Published groups" />,
        <StatCard key="active" label="Active" value={String(categoryList.filter((category) => category.is_active).length)} note="Visible to staff" />,
        <StatCard key="items" label="Linked items" value={String(categoryList.reduce((sum, category) => sum + (category.items_count || 0), 0))} note="Across categories" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!categoryList.length} loadingLabel="Loading categories...">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel eyebrow="Structure" title="Category organization">
            <div className="grid gap-3">
              {categoryList.map((category) => (
                <div key={category.id} className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{category.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{category.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{category.items_count} items</span>
                      {canManage ? (
                        <>
                          <button className="rounded-xl border border-black/8 bg-white p-2 text-slate-600" onClick={() => openEditModal(category)} type="button">
                            <Pencil className="size-4" />
                          </button>
                          <button
                            className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700"
                            disabled={busyId === category.id}
                            onClick={() => handleDelete(category.id)}
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Status" title="Category health">
            <div className="space-y-3">
              {categoryList.map((category) => (
                <QueueItem
                  key={category.id}
                  title={category.name}
                  meta={`Display order ${category.display_order}`}
                  status={category.is_active ? "Active" : "Inactive"}
                  tone={category.is_active ? "lime" : "red"}
                />
              ))}
            </div>
          </Panel>
        </div>
      </DataState>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-black/8 bg-[#fbfbf8] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.24)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  {editingCategoryId ? "Edit category" : "Create category"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {editingCategoryId ? "Update menu category" : "Add a menu category"}
                </h2>
              </div>

              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:bg-slate-50" onClick={closeModal} type="button">
                <X className="size-5" />
              </button>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {modalMessage ? <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{modalMessage}</div> : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                <input className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="name" onChange={handleChange} required value={form.name} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                <textarea className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="description" onChange={handleChange} value={form.description} />
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Display order</span>
                  <input className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" min="0" name="display_order" onChange={handleChange} type="number" value={form.display_order} />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-700">
                  <input checked={form.is_active} name="is_active" onChange={handleChange} type="checkbox" />
                  Active category
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none" onClick={closeModal} type="button">
                  Cancel
                </Button>
                <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingCategoryId ? "Update category" : "Create category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export { MenuCategoriesPage };
