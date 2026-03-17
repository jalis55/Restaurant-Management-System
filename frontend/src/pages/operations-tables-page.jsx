import { Clock3, Pencil, Plus, TableProperties, Trash2, Users, X } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/hooks/use-auth";
import { createTable, deleteTable, listTables, updateTable } from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultForm = {
  capacity: 2,
  is_active: true,
  location: "",
  number: "",
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

function OperationsTablesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const { data: tables, error, isLoading, setData: setTables } = useAsyncData(() => listTables());
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const tableList = tables ?? [];
  const activeTables = tableList.filter((table) => table.is_active);
  const totalSeats = activeTables.reduce((sum, table) => sum + table.capacity, 0);

  function openCreateModal() {
    setEditingTableId(null);
    setForm(defaultForm);
    setModalMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(table) {
    setEditingTableId(table.id);
    setForm({
      capacity: table.capacity,
      is_active: table.is_active,
      location: table.location || "",
      number: table.number,
    });
    setModalMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTableId(null);
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
      capacity: Number(form.capacity),
      is_active: form.is_active,
      location: form.location,
      number: Number(form.number),
    };

    try {
      const savedTable = editingTableId ? await updateTable(editingTableId, payload) : await createTable(payload);

      setTables((currentTables) => {
        const existingTables = currentTables ?? [];
        const nextTables = editingTableId
          ? existingTables.map((table) => (table.id === editingTableId ? savedTable : table))
          : [...existingTables, savedTable];

        return [...nextTables].sort((left, right) => left.number - right.number);
      });

      setMessage(editingTableId ? "Table updated." : "Table created.");
      closeModal();
    } catch (submitError) {
      setModalMessage(submitError?.data?.detail || formatApiError(submitError?.data) || submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(tableId) {
    setBusyId(tableId);
    setMessage("");

    try {
      await deleteTable(tableId);
      setTables((currentTables) => currentTables.filter((table) => table.id !== tableId));
      setMessage("Table deleted.");
    } catch (actionError) {
      setMessage(actionError?.data?.detail || formatApiError(actionError?.data) || actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Operations"
      title="Tables"
      description="See room readiness, capacity usage, and which tables need the quickest turn-around."
      actions={
        canManage ? (
          <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" onClick={openCreateModal} type="button">
            <Plus className="size-4" />
            Add table
          </Button>
        ) : null
      }
      stats={[
        <StatCard key="tables" label="Active tables" value={String(activeTables.length)} note="Currently bookable" />,
        <StatCard key="capacity" label="Seat capacity" value={String(totalSeats)} note="Total active seats" />,
        <StatCard key="inactive" label="Inactive" value={String(tableList.length - activeTables.length)} note="Unavailable for booking" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!tableList.length} loadingLabel="Loading tables...">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel eyebrow="Dining room" title="Table readiness map">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tableList.map((table) => (
                <div key={table.id} className="rounded-[24px] border border-black/6 bg-[#f7f7f4] p-4">
                  <div className={cn("h-3 w-16 rounded-full", table.is_active ? "bg-lime-400" : "bg-red-400")} />
                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">Table {table.number}</p>
                      <p className="mt-2 text-sm text-slate-600">{table.location || "Dining room"}</p>
                      <p className="mt-2 text-sm text-slate-500">Capacity {table.capacity}</p>
                    </div>

                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <button className="rounded-xl border border-black/8 bg-white p-2 text-slate-600" onClick={() => openEditModal(table)} type="button">
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700"
                          disabled={busyId === table.id}
                          onClick={() => handleDelete(table.id)}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel eyebrow="Coverage" title="Capacity pulse">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <MiniMetric icon={TableProperties} label="Active Tables" value={String(activeTables.length)} tone="slate" />
                <MiniMetric icon={Clock3} label="Inactive" value={String(tableList.length - activeTables.length)} tone="amber" />
                <MiniMetric icon={Users} label="Seat Capacity" value={String(totalSeats)} tone="blue" />
              </div>
            </Panel>

            <Panel eyebrow="Attention" title="Table distribution">
              <div className="space-y-3">
                {tableList.slice(0, 5).map((table) => (
                  <QueueItem
                    key={table.id}
                    title={`Table ${table.number}`}
                    meta={`${table.location || "Dining room"} · Capacity ${table.capacity}`}
                    status={table.is_active ? "Active" : "Inactive"}
                    tone={table.is_active ? "lime" : "red"}
                  />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </DataState>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-black/8 bg-[#fbfbf8] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.24)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  {editingTableId ? "Edit table" : "Create table"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {editingTableId ? "Update dining table" : "Add a dining table"}
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
                  <span className="mb-2 block text-sm font-medium text-slate-700">Table number</span>
                  <input
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                    min="1"
                    name="number"
                    onChange={handleChange}
                    required
                    type="number"
                    value={form.number}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Capacity</span>
                  <input
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                    min="1"
                    name="capacity"
                    onChange={handleChange}
                    required
                    type="number"
                    value={form.capacity}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
                <input className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="location" onChange={handleChange} value={form.location} />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-700">
                <input checked={form.is_active} name="is_active" onChange={handleChange} type="checkbox" />
                Active table
              </label>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none" onClick={closeModal} type="button">
                  Cancel
                </Button>
                <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingTableId ? "Update table" : "Create table"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export { OperationsTablesPage };
