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

function getOrderActionButtonClass(status) {
  const baseClass = "rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-55";

  const toneClassByStatus = {
    confirmed: "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100",
    preparing: "border-orange-200 bg-orange-50 text-orange-900 hover:border-orange-300 hover:bg-orange-100",
    ready: "border-lime-200 bg-lime-50 text-lime-900 hover:border-lime-300 hover:bg-lime-100",
    served: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100",
    cancelled: "border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100",
  };

  return `${baseClass} ${toneClassByStatus[status] ?? "border-black/8 bg-[#f7f7f4] text-slate-700 hover:bg-slate-950 hover:text-white"}`;
}

export { formatOrderStatus, getNextOrderStatuses, getOrderActionButtonClass, getOrderTone };
