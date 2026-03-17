import { ArrowRight, Boxes, ClipboardList, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";

const stats = [
  { label: "Open products", value: "128", note: "12 added this week" },
  { label: "Pending RFQs", value: "18", note: "5 need response today" },
  { label: "Fulfillment", value: "96%", note: "Up 4.2% this month" },
];

const highlights = [
  {
    title: "Welcome back",
    body: "Your inventory workspace is set up. Jump into products, review incoming requests, or keep shaping the rest of the dashboard.",
    icon: Sparkles,
  },
  {
    title: "Products hub",
    body: "Track stock levels, status changes, and grades across every SKU from one table view.",
    icon: Boxes,
  },
  {
    title: "RFQ workflow",
    body: "Capture supplier requests, deadlines, and costing notes in a dedicated page.",
    icon: ClipboardList,
  },
];

function DashboardPage() {
  return (
    <PageShell
      eyebrow="Workspace"
      title="Dashboard"
      description="A simple welcome view for the dashboard home route."
      actions={
        <>
          <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none">
            View reports
          </Button>
          <Button className="h-11 rounded-xl bg-black px-5 text-sm text-white hover:bg-black/90">
            Open products
            <ArrowRight className="size-4" />
          </Button>
        </>
      }
      stats={stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-black/6 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">{stat.value}</p>
          <p className="mt-1 text-sm text-slate-500">{stat.note}</p>
        </div>
      ))}
    >
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Today</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Ready to build out your workspace.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This is the index route for the dashboard. You can use it as a landing page with announcements, quick
            actions, KPI cards, charts, or recent activity.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-2xl bg-[#f6f6f3] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Quick start</p>
          <ul className="mt-4 space-y-3">
            <li className="rounded-2xl border border-black/6 p-4">
              <p className="text-base font-semibold text-slate-950">1. Review inventory</p>
              <p className="mt-1 text-sm text-slate-600">Use the Products page to sort, search, and manage stock.</p>
            </li>
            <li className="rounded-2xl border border-black/6 p-4">
              <p className="text-base font-semibold text-slate-950">2. Create RFQs</p>
              <p className="mt-1 text-sm text-slate-600">Capture supplier needs and move requests into production planning.</p>
            </li>
            <li className="rounded-2xl border border-black/6 p-4">
              <p className="text-base font-semibold text-slate-950">3. Expand later</p>
              <p className="mt-1 text-sm text-slate-600">We can keep adding charts, notifications, and real data next.</p>
            </li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

export { DashboardPage };
