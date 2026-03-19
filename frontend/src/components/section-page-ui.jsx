import { cn } from "@/lib/utils";

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function Panel({ eyebrow, title, description, children, className }) {
  return (
    <section className={cn("rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]", className)}>
      {eyebrow ? <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p> : null}
      {title ? <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      <div className={title || description ? "mt-6" : ""}>{children}</div>
    </section>
  );
}

function QueueItem({ title, meta, status, tone = "slate" }) {
  const tones = {
    slate: "border-black/6 bg-[#f6f6f3] text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    orange: "border-orange-200 bg-orange-50 text-orange-900",
    lime: "border-lime-200 bg-lime-50 text-lime-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
  };

  return (
    <div className="rounded-2xl border border-black/6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{meta}</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", tones[tone])}>{status}</span>
      </div>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value, tone = "slate" }) {
  const MetricIcon = Icon;
  const tones = {
    slate: "bg-slate-950 text-white",
    amber: "bg-amber-500 text-white",
    lime: "bg-lime-400 text-slate-950",
    blue: "bg-sky-500 text-white",
  };

  return (
    <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", tones[tone])}>
        <MetricIcon className="size-5" />
      </div>
      <p className="mt-4 text-sm uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export { MiniMetric, Panel, QueueItem, StatCard };
