const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

const ORDER_STATUS_TONES = {
  pending: "blue",
  confirmed: "amber",
  preparing: "orange",
  ready: "lime",
  served: "emerald",
  cancelled: "red",
};

const ORDER_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [],
  cancelled: [],
};

function formatOrderStatus(status) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function getOrderTone(status) {
  return ORDER_STATUS_TONES[status] ?? "slate";
}

function getNextOrderStatuses(status) {
  return ORDER_TRANSITIONS[status] ?? [];
}

export { formatOrderStatus, getNextOrderStatuses, getOrderTone };
