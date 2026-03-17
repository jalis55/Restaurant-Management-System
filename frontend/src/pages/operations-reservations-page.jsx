import { Clock3, TableProperties, Users } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listReservations, updateReservationStatus } from "@/lib/api";
import { formatReservationStatus, getNextReservationStatuses, getReservationTone } from "@/lib/reservation-utils";

function formatReservationMeta(reservation) {
  const startTime = new Date(reservation.reserved_at).toLocaleString();
  return `${reservation.guest_name} · ${reservation.party_size} guests · Table ${reservation.table_number || "-" } · ${startTime}`;
}

function OperationsReservationsPage() {
  const { data: reservations, error, isLoading, setData: setReservations } = useAsyncData(() => listReservations());
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const reservationList = reservations ?? [];
  const pendingReservations = reservationList.filter((reservation) => reservation.status === "pending");
  const confirmedReservations = reservationList.filter((reservation) => reservation.status === "confirmed");

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

  return (
    <PageShell
      eyebrow="Operations"
      title="Reservations"
      description="Review bookings, guest pacing, and upcoming table demand before service gets busy."
      stats={[
        <StatCard key="bookings" label="Bookings" value={String(reservationList.length)} note="Total reservations" />,
        <StatCard key="pending" label="Pending" value={String(pendingReservations.length)} note="Need confirmation" />,
        <StatCard key="confirmed" label="Confirmed" value={String(confirmedReservations.length)} note="Ready to seat" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!reservationList.length} loadingLabel="Loading reservations...">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel eyebrow="Guest flow" title="Reservation pacing">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric icon={Users} label="Total covers" value={String(reservationList.reduce((sum, reservation) => sum + reservation.party_size, 0))} tone="slate" />
              <MiniMetric icon={Clock3} label="Pending" value={String(pendingReservations.length)} tone="amber" />
              <MiniMetric icon={TableProperties} label="Confirmed" value={String(confirmedReservations.length)} tone="blue" />
            </div>

            <div className="mt-6 space-y-3">
              {reservationList.slice(0, 6).map((reservation) => (
                <div key={reservation.id} className="rounded-2xl border border-black/6 p-4">
                  <QueueItem
                    title={reservation.guest_name}
                    meta={formatReservationMeta(reservation)}
                    status={formatReservationStatus(reservation.status)}
                    tone={getReservationTone(reservation.status)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
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

          <Panel eyebrow="Front desk" title="Arrival checklist">
            <div className="space-y-3">
              {pendingReservations.slice(0, 4).map((reservation) => (
                <QueueItem
                  key={reservation.id}
                  title={reservation.guest_name}
                  meta={`${reservation.party_size} guests · ${new Date(reservation.reserved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  status={formatReservationStatus(reservation.status)}
                  tone={getReservationTone(reservation.status)}
                />
              ))}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { OperationsReservationsPage };
