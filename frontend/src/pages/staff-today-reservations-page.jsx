import { Clock3, Star, Users } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { MiniMetric, Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listTodayReservations, updateReservationStatus } from "@/lib/api";
import { formatReservationStatus, getNextReservationStatuses, getReservationTone } from "@/lib/reservation-utils";

function StaffTodayReservationsPage() {
  const { data: reservations, error, isLoading, setData: setReservations } = useAsyncData(() => listTodayReservations());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const reservationList = reservations ?? [];

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
      eyebrow="Staff Panel"
      title="Today's Reservations"
      description="Manage today's bookings, upcoming arrivals, and the notes your front-of-house team needs on hand."
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
    </PageShell>
  );
}

export { StaffTodayReservationsPage };
