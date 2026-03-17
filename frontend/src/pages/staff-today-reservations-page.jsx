import { Clock3, Pencil, Plus, Star, Users, X } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { createReservation, listTables, listTodayReservations, updateReservation, updateReservationStatus } from "@/lib/api";
import { formatReservationStatus, getNextReservationStatuses, getReservationTone } from "@/lib/reservation-utils";

const defaultForm = {
  guest_name: "",
  guest_phone: "",
  guest_email: "",
  party_size: 2,
  reserved_at: "",
  reserved_until: "",
  special_requests: "",
  table: "",
};

function toInputDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function StaffTodayReservationsPage() {
  const { data: reservations, error, isLoading, setData: setReservations } = useAsyncData(() => listTodayReservations());
  const { data: tables } = useAsyncData(() => listTables());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const reservationList = reservations ?? [];
  const tableList = tables ?? [];

  function openCreateModal() {
    setEditingReservationId(null);
    setForm(defaultForm);
    setModalMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(reservation) {
    setEditingReservationId(reservation.id);
    setForm({
      guest_name: reservation.guest_name,
      guest_phone: reservation.guest_phone,
      guest_email: reservation.guest_email || "",
      party_size: reservation.party_size,
      reserved_at: toInputDateTime(reservation.reserved_at),
      reserved_until: toInputDateTime(reservation.reserved_until),
      special_requests: reservation.special_requests || "",
      table: String(reservation.table),
    });
    setModalMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingReservationId(null);
    setForm(defaultForm);
    setModalMessage("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleStatusChange(reservationId, status) {
    setBusyId(reservationId);
    setMessage("");

    try {
      const updatedReservation = await updateReservationStatus(reservationId, status);
      setReservations((currentReservations) =>
        currentReservations.map((reservation) => (reservation.id === reservationId ? updatedReservation : reservation)),
      );
      setMessage(`Reservation moved to ${formatReservationStatus(status)}.`);
    } catch (actionError) {
      setMessage(actionError?.data?.detail || actionError.message || "Unable to update the reservation.");
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
      guest_email: form.guest_email || "",
      party_size: Number(form.party_size),
      table: Number(form.table),
      reserved_at: new Date(form.reserved_at).toISOString(),
      reserved_until: new Date(form.reserved_until).toISOString(),
    };

    try {
      const savedReservation = editingReservationId
        ? await updateReservation(editingReservationId, payload)
        : await createReservation(payload);

      setReservations((currentReservations) => {
        const existingReservations = currentReservations ?? [];
        const nextReservations = editingReservationId
          ? existingReservations.map((reservation) => (reservation.id === editingReservationId ? savedReservation : reservation))
          : [...existingReservations, savedReservation];

        return [...nextReservations].sort((left, right) => new Date(left.reserved_at) - new Date(right.reserved_at));
      });

      setMessage(editingReservationId ? "Reservation updated." : "Reservation created.");
      closeModal();
    } catch (submitError) {
      setModalMessage(submitError?.data?.detail || JSON.stringify(submitError?.data || {}) || submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Staff Panel"
      title="Today's Reservations"
      description="Manage today's bookings, upcoming arrivals, and the notes your front-of-house team needs on hand."
      actions={
        <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" onClick={openCreateModal} type="button">
          <Plus className="size-4" />
          New reservation
        </Button>
      }
      stats={[
        <StatCard key="arrivals" label="Arrivals" value={String(reservationList.length)} note="Remaining today" />,
        <StatCard key="vip" label="VIP notes" value={String(reservationList.filter((reservation) => reservation.special_requests).length)} note="Special handling" />,
        <StatCard key="large" label="Large parties" value={String(reservationList.filter((reservation) => reservation.party_size >= 6).length)} note="Need setup" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!reservationList.length} loadingLabel="Loading today's reservations...">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel eyebrow="Front desk" title="Today's reservations">
            <div className="space-y-3">
              {reservationList.map((reservation) => (
                <div key={reservation.id} className="rounded-2xl border border-black/6 p-4">
                  <QueueItem
                    title={`${new Date(reservation.reserved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${reservation.guest_name}`}
                    meta={`${reservation.party_size} guests · Table ${reservation.table_number || "-"} · ${reservation.special_requests || "No special requests"}`}
                    status={formatReservationStatus(reservation.status)}
                    tone={getReservationTone(reservation.status)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-950 hover:text-white"
                      onClick={() => openEditModal(reservation)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Pencil className="size-3.5" />
                        Edit
                      </span>
                    </button>
                    {getNextReservationStatuses(reservation.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className="rounded-xl border border-black/8 bg-[#f7f7f4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-950 hover:text-white"
                        disabled={busyId === reservation.id}
                        onClick={() => handleStatusChange(reservation.id, nextStatus)}
                        type="button"
                      >
                        {busyId === reservation.id ? "Updating..." : formatReservationStatus(nextStatus)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Arrival prep" title="Host stand focus">
            <div className="grid gap-3">
              <MiniMetric icon={Users} label="Guest Covers" value={String(reservationList.reduce((sum, reservation) => sum + reservation.party_size, 0))} tone="slate" />
              <MiniMetric icon={Clock3} label="Upcoming" value={String(reservationList.filter((reservation) => ["pending", "confirmed"].includes(reservation.status)).length)} tone="amber" />
              <MiniMetric icon={Star} label="VIP Notes" value={String(reservationList.filter((reservation) => reservation.special_requests).length)} tone="blue" />
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
                  {editingReservationId ? "Edit reservation" : "Create reservation"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {editingReservationId ? "Update booking details" : "Add a new booking"}
                </h2>
              </div>

              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:bg-slate-50"
                onClick={closeModal}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {modalMessage ? (
                <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{modalMessage}</div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["guest_name", "Guest name", "text"],
                  ["guest_phone", "Guest phone", "text"],
                  ["guest_email", "Guest email", "email"],
                  ["party_size", "Party size", "number"],
                ].map(([name, label, type]) => (
                  <label key={name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
                    <input
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                      min={name === "party_size" ? "1" : undefined}
                      name={name}
                      onChange={handleFormChange}
                      required={name !== "guest_email"}
                      type={type}
                      value={form[name]}
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Table</span>
                  <select
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                    name="table"
                    onChange={handleFormChange}
                    required
                    value={form.table}
                  >
                    <option value="">Select a table</option>
                    {tableList.map((table) => (
                      <option key={table.id} value={table.id}>
                        Table {table.number} · {table.location || "Dining room"} · {table.capacity} seats
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Reserved at</span>
                  <input
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                    name="reserved_at"
                    onChange={handleFormChange}
                    required
                    type="datetime-local"
                    value={form.reserved_at}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Reserved until</span>
                  <input
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                    name="reserved_until"
                    onChange={handleFormChange}
                    required
                    type="datetime-local"
                    value={form.reserved_until}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Special requests</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                  name="special_requests"
                  onChange={handleFormChange}
                  value={form.special_requests}
                />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </Button>
                <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingReservationId ? "Update reservation" : "Create reservation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export { StaffTodayReservationsPage };
