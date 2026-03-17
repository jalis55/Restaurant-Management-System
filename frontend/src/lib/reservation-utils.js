const RESERVATION_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const RESERVATION_STATUS_TONES = {
  pending: "amber",
  confirmed: "blue",
  seated: "lime",
  completed: "slate",
  cancelled: "red",
  no_show: "red",
};

const RESERVATION_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["seated", "completed", "cancelled", "no_show"],
  seated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function formatReservationStatus(status) {
  return RESERVATION_STATUS_LABELS[status] ?? status;
}

function getReservationTone(status) {
  return RESERVATION_STATUS_TONES[status] ?? "slate";
}

function getNextReservationStatuses(status) {
  return RESERVATION_TRANSITIONS[status] ?? [];
}

export { formatReservationStatus, getNextReservationStatuses, getReservationTone };
