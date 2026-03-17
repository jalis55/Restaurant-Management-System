import {
  ArrowRight,
  CheckCheck,
  ChefHat,
  Clock3,
  DollarSign,
  Flame,
  ReceiptText,
  ShieldAlert,
  Star,
  TableProperties,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { getDefaultPathForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function formatRole(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Staff";
}

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
    lime: "border-lime-200 bg-lime-50 text-lime-900",
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

function OrdersOperationsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <Panel
        eyebrow="Live queue"
        title="Shift-wide order control"
        description="Track what is newly placed, what is slowing down, and which tickets need attention before they affect service."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <MiniMetric icon={ReceiptText} label="Open Tickets" value="48" tone="slate" />
          <MiniMetric icon={Clock3} label="Avg Ticket Time" value="14 min" tone="amber" />
          <MiniMetric icon={CheckCheck} label="Completed Today" value="186" tone="lime" />
        </div>

        <div className="mt-6 space-y-3">
          <QueueItem title="Table 12 · Dine in" meta="4 items · created 3 min ago · waiter Nadia" status="New" tone="blue" />
          <QueueItem title="Order #3021 · Delivery" meta="6 items · created 8 min ago · kitchen waiting" status="At risk" tone="red" />
          <QueueItem title="Table 4 · Dine in" meta="2 items · plated and ready for handoff" status="Ready" tone="lime" />
          <QueueItem title="Order #3016 · Pickup" meta="Payment captured · customer arriving in 5 min" status="Expedite" tone="amber" />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel eyebrow="Watchlist" title="Service blockers">
          <div className="space-y-3">
            <QueueItem title="Late kitchen response" meta="7 orders above target prep time" status="Needs attention" tone="red" />
            <QueueItem title="Cashier handoff" meta="3 pickup orders awaiting payment confirmation" status="Pending" tone="amber" />
            <QueueItem title="Floor pacing" meta="Reservations arriving in the next 20 minutes" status="Heads up" tone="blue" />
          </div>
        </Panel>

        <Panel eyebrow="Flow" title="Status cadence">
          <div className="space-y-4">
            {[
              ["Placed", "18 tickets", "bg-slate-950"],
              ["Preparing", "11 tickets", "bg-amber-500"],
              ["Ready", "6 tickets", "bg-lime-400"],
              ["Served", "13 tickets", "bg-sky-500"],
            ].map(([label, value, bar]) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className={cn("h-2 rounded-full", bar, label === "Placed" ? "w-[74%]" : label === "Preparing" ? "w-[58%]" : label === "Ready" ? "w-[31%]" : "w-[67%]")} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ReservationsOperationsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Guest flow" title="Reservation pacing">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric icon={Users} label="Covers Tonight" value="84" tone="slate" />
          <MiniMetric icon={Clock3} label="Next Arrival" value="6:45 PM" tone="amber" />
          <MiniMetric icon={TableProperties} label="Tables Reserved" value="17" tone="blue" />
        </div>

        <div className="mt-6 grid gap-3">
          <QueueItem title="Rahman party · 6 guests" meta="6:45 PM · Anniversary note · table 8 requested" status="Confirmed" tone="lime" />
          <QueueItem title="Mia Chowdhury · 2 guests" meta="7:00 PM · Window preference · first-time guest" status="Seating soon" tone="amber" />
          <QueueItem title="Corporate booking · 10 guests" meta="7:30 PM · Pre-ordered menu pending final confirmation" status="Follow up" tone="red" />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel eyebrow="Front desk" title="Arrival checklist">
          <div className="space-y-3">
            {["Confirm VIP table setup", "Message kitchen on group booking", "Release late arrivals after 15 minutes", "Balance indoor and patio sections"].map((item) => (
              <div key={item} className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Demand" title="Booking mix">
          <div className="space-y-4">
            {[
              ["Walk-in pressure", "High after 8 PM"],
              ["Family tables", "6 currently blocked"],
              ["No-show risk", "2 reservations flagged"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TablesOperationsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel eyebrow="Dining room" title="Table readiness map">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Table 01", "Seated · 2 guests", "lime"],
            ["Table 04", "Needs reset", "amber"],
            ["Table 06", "Reserved · 7:15 PM", "blue"],
            ["Table 08", "Main course out", "slate"],
            ["Table 11", "Awaiting payment", "amber"],
            ["Table 14", "Available", "lime"],
          ].map(([label, note, tone]) => (
            <div key={label} className="rounded-[24px] border border-black/6 bg-[#f7f7f4] p-4">
              <div
                className={cn(
                  "h-3 w-16 rounded-full",
                  tone === "lime" ? "bg-lime-400" : tone === "amber" ? "bg-amber-400" : tone === "blue" ? "bg-sky-500" : "bg-slate-950",
                )}
              />
              <p className="mt-5 text-lg font-semibold text-slate-950">{label}</p>
              <p className="mt-2 text-sm text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel eyebrow="Coverage" title="Capacity pulse">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MiniMetric icon={TableProperties} label="Occupied" value="11 / 18" tone="slate" />
            <MiniMetric icon={Clock3} label="Next Reset" value="9 min" tone="amber" />
            <MiniMetric icon={Users} label="Available Seats" value="24" tone="blue" />
          </div>
        </Panel>

        <Panel eyebrow="Attention" title="Turnover priorities">
          <div className="space-y-3">
            <QueueItem title="Table 04" meta="Guests just left · reset before 6:50 PM reservation" status="Reset now" tone="amber" />
            <QueueItem title="Table 11" meta="Dessert served 14 min ago · likely close to payment" status="Watch" tone="blue" />
            <QueueItem title="Patio 02" meta="Weather shift may require move indoors" status="Contingency" tone="red" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MenuItemsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel eyebrow="Availability" title="Menu item control">
        <div className="overflow-hidden rounded-[24px] border border-black/6">
          <table className="min-w-full border-collapse bg-white">
            <thead>
              <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                <th className="px-5 py-4 font-medium">Item</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Smoked Beef Burger", "Mains", "$14.50", "Live"],
                ["Citrus Burrata", "Starters", "$10.20", "Low stock"],
                ["Seafood Linguine", "Mains", "$17.90", "Prep hold"],
                ["Mango Panna Cotta", "Dessert", "$6.80", "Live"],
              ].map(([name, category, price, status]) => (
                <tr key={name} className="border-b border-black/6 last:border-b-0">
                  <td className="px-5 py-4 text-[15px] font-medium text-slate-950">{name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{category}</td>
                  <td className="px-5 py-4 text-sm text-slate-950">{price}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        status === "Live" && "bg-lime-100 text-lime-900",
                        status === "Low stock" && "bg-amber-100 text-amber-900",
                        status === "Prep hold" && "bg-red-100 text-red-900",
                      )}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel eyebrow="Change queue" title="Needs update">
          <div className="space-y-3">
            <QueueItem title="Seasonal soup" meta="Recipe cost changed after supplier price update" status="Reprice" tone="amber" />
            <QueueItem title="Truffle fries" meta="Inventory running low for the evening shift" status="86 soon" tone="red" />
            <QueueItem title="Vegan platter" meta="Selling above forecast this week" status="Promote" tone="lime" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MenuCategoriesPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel eyebrow="Structure" title="Category organization">
        <div className="grid gap-3">
          {[
            ["Starters", "9 items live", "Most viewed at lunch service"],
            ["Mains", "18 items live", "Highest revenue contribution"],
            ["Dessert", "7 items live", "Strongest attach rate after 8 PM"],
            ["Beverages", "14 items live", "Needs better mobile ordering labels"],
          ].map(([title, note, meta]) => (
            <div key={title} className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{note}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{meta}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Optimization" title="Category notes">
        <div className="space-y-3">
          {["Move beverages higher in QR ordering flow", "Merge duplicate brunch tags before weekend rush", "Create a chef special category for Friday night tasting menu"].map((item) => (
            <div key={item} className="rounded-2xl border border-black/6 p-4 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RevenueReportPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Revenue" title="Daily performance">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric icon={DollarSign} label="Today" value="$8,420" tone="slate" />
          <MiniMetric icon={TrendingUp} label="Vs Yesterday" value="+12.4%" tone="lime" />
          <MiniMetric icon={ReceiptText} label="Avg Check" value="$26.90" tone="blue" />
        </div>

        <div className="mt-6 rounded-[24px] bg-[#f7f7f4] p-5">
          <div className="flex items-end gap-3">
            {[42, 55, 48, 66, 61, 74, 70].map((height, index) => (
              <div key={height} className="flex-1">
                <div className={cn("rounded-t-2xl", index === 5 ? "bg-lime-400" : "bg-slate-950/85")} style={{ height: `${height * 2}px` }} />
                <p className="mt-2 text-center text-xs text-slate-400">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Insights" title="Revenue drivers">
        <div className="space-y-3">
          <QueueItem title="Dinner service" meta="Highest contribution between 7 PM and 9 PM" status="Strong" tone="lime" />
          <QueueItem title="Delivery channel" meta="Flat growth compared to last week" status="Watch" tone="amber" />
          <QueueItem title="Late lunch dip" meta="Traffic soft between 3 PM and 4 PM" status="Opportunity" tone="blue" />
        </div>
      </Panel>
    </div>
  );
}

function TopItemsReportPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel eyebrow="Top sellers" title="Best-performing items">
        <div className="space-y-3">
          {[
            ["Smoked Beef Burger", "146 orders", "Top revenue item"],
            ["Seafood Linguine", "119 orders", "Strong dinner conversion"],
            ["Mango Panna Cotta", "95 orders", "Best dessert attach rate"],
            ["Cold Brew Tonic", "88 orders", "Fastest beverage growth"],
          ].map(([title, value, note], index) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl border border-black/6 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">{index + 1}</div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-950">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{note}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-950">{value}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Last 30 days</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Patterns" title="Menu momentum">
        <div className="space-y-3">
          <QueueItem title="Desserts" meta="Attach rate up 8% after new table script" status="Growing" tone="lime" />
          <QueueItem title="Chef specials" meta="Interest is high, but stock planning is uneven" status="Volatile" tone="amber" />
          <QueueItem title="Beverages" meta="Cold drinks strongest on weekend lunch" status="Seasonal" tone="blue" />
        </div>
      </Panel>
    </div>
  );
}

function StaffPerformancePage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Team output" title="Shift performance">
        <div className="overflow-hidden rounded-[24px] border border-black/6">
          <table className="min-w-full border-collapse bg-white">
            <thead>
              <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                <th className="px-5 py-4 font-medium">Staff</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Throughput</th>
                <th className="px-5 py-4 font-medium">Service Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Nadia Rahman", "Waiter", "32 tickets", "96%"],
                ["Imran A.", "Kitchen", "28 dishes/hr", "93%"],
                ["Samiul Karim", "Cashier", "74 payments", "98%"],
                ["Arefin Noor", "Waiter", "27 tickets", "91%"],
              ].map(([name, role, throughput, score]) => (
                <tr key={name} className="border-b border-black/6 last:border-b-0">
                  <td className="px-5 py-4 text-[15px] font-medium text-slate-950">{name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{role}</td>
                  <td className="px-5 py-4 text-sm text-slate-950">{throughput}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-950">{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel eyebrow="Coaching" title="Manager notes">
        <div className="space-y-3">
          <QueueItem title="Expo handoff" meta="Kitchen-to-floor timing improved on dinner shift" status="Positive" tone="lime" />
          <QueueItem title="Reservation greeting" meta="Front desk consistency dips during peak overlap" status="Coach" tone="amber" />
          <QueueItem title="Service closeout" meta="Waiter handoff stays sharp during the dinner rush" status="Strong" tone="blue" />
        </div>
      </Panel>
    </div>
  );
}

function StaffAccountsPage({ user }) {
  const isManager = user?.role === "manager";

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Access control" title="Staff account workspace">
        <div className="space-y-3">
          {[
            ["Owner account", "admin", "Active", "Full permissions"],
            ["Floor manager", "manager", "Active", "Cannot delete users"],
            ["Nadia Rahman", "waiter", "Active", "Reservations + new orders"],
            ["Imran A.", "kitchen", "Active", "Kitchen display only"],
          ].map(([name, role, status, scope]) => (
            <div key={name} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/6 p-4">
              <div>
                <p className="text-base font-semibold text-slate-950">{name}</p>
                <p className="mt-1 text-sm text-slate-500">{scope}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{role}</span>
                <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-900">{status}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        {isManager ? (
          <Panel eyebrow="Guardrail" title="Manager restriction">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-base font-semibold text-amber-950">
                <ShieldAlert className="size-4" />
                Destructive user deletion stays disabled
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">
                Managers can create and update staff accounts, but permanent delete actions should remain unavailable.
              </p>
            </div>
          </Panel>
        ) : null}

        <Panel eyebrow="Actions" title="Account operations">
          <div className="space-y-3">
            {["Invite new team member", "Change role assignments", "Reset account passwords", "Review inactive staff accounts"].map((item) => (
              <div key={item} className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ProfilePage({ user }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel eyebrow="Account" title="Profile overview">
        <div className="rounded-[24px] bg-[#f7f7f4] p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
            <Users className="size-7" />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-950">{user?.first_name || user?.username || "Staff user"}</h3>
          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-slate-400">{user?.role || "staff"}</p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-black/6 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Username</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{user?.username}</p>
            </div>
            <div className="rounded-2xl border border-black/6 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{user?.email || "No email on file"}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Preferences" title="Profile settings">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Display name", user?.first_name ? `${user.first_name} ${user?.last_name || ""}`.trim() : user?.username],
            ["Phone", user?.phone || "Not set"],
            ["Role", formatRole(user?.role)],
            ["Access status", user?.is_active ? "Active" : "Inactive"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function NewOrderPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel eyebrow="Front of house" title="Create a new order">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Service type", "Dine in"],
            ["Table number", "12"],
            ["Guest count", "4"],
            ["Assigned staff", "Nadia Rahman"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <QueueItem title="Smoked Beef Burger x2" meta="No onions · add extra sauce" status="$29.00" tone="slate" />
          <QueueItem title="Cold Brew Tonic x2" meta="Serve after starters" status="$11.00" tone="blue" />
          <QueueItem title="Mango Panna Cotta x1" meta="Hold until main course is cleared" status="$6.80" tone="lime" />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel eyebrow="Order summary" title="Ticket handoff">
          <div className="space-y-3">
            <QueueItem title="Kitchen prep" meta="Estimated 16 minutes for mains" status="On track" tone="lime" />
            <QueueItem title="Special instructions" meta="One guest has a nut allergy" status="Flagged" tone="red" />
            <QueueItem title="Current total" meta="Taxes included" status="$46.80" tone="blue" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ActiveOrdersPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Live board" title="Active orders">
        <div className="space-y-3">
          <QueueItem title="Table 3" meta="2 mains · waiting on drinks" status="Preparing" tone="amber" />
          <QueueItem title="Pickup #491" meta="Payment complete · handoff in 6 minutes" status="Ready soon" tone="blue" />
          <QueueItem title="Table 9" meta="Dessert fired · server requested rush" status="Priority" tone="red" />
          <QueueItem title="Delivery #487" meta="Packed and awaiting rider" status="Ready" tone="lime" />
        </div>
      </Panel>

      <Panel eyebrow="Shift signals" title="What needs attention">
        <div className="grid gap-3">
          <MiniMetric icon={Clock3} label="Delayed" value="4 orders" tone="amber" />
          <MiniMetric icon={ReceiptText} label="Open" value="19 orders" tone="slate" />
          <MiniMetric icon={CheckCheck} label="Ready" value="6 orders" tone="lime" />
        </div>
      </Panel>
    </div>
  );
}

function KitchenDisplayPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel eyebrow="Kitchen" title="Production line">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Fire now", "6 tickets", "red"],
            ["Plating", "4 tickets", "amber"],
            ["Ready to pass", "3 tickets", "lime"],
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-[24px] border border-black/6 bg-[#f7f7f4] p-4">
              <div className={cn("h-3 w-16 rounded-full", tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-400" : "bg-lime-400")} />
              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <QueueItem title="Table 12 · mains" meta="2 burgers, 1 linguine, 1 grilled fish · allergy note attached" status="Fire" tone="red" />
          <QueueItem title="Pickup #491" meta="2 wraps, fries, cold brew tonic" status="Plate" tone="amber" />
          <QueueItem title="Table 4 · dessert" meta="3 panna cottas with berry garnish" status="Pass" tone="lime" />
        </div>
      </Panel>

      <Panel eyebrow="Chef notes" title="Kitchen priorities">
        <div className="space-y-3">
          <QueueItem title="Allergy handling" meta="Separate station for nut-free burger order" status="Critical" tone="red" />
          <QueueItem title="Prep stock" meta="Only 4 seafood portions remain for the shift" status="Low stock" tone="amber" />
          <QueueItem title="Expo pace" meta="Floor is ready to receive next two tickets" status="Aligned" tone="blue" />
        </div>
      </Panel>
    </div>
  );
}

function TodayReservationsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Front desk" title="Today's reservations">
        <div className="space-y-3">
          <QueueItem title="6:45 PM · Rahman party" meta="6 guests · anniversary setup requested" status="Confirmed" tone="lime" />
          <QueueItem title="7:00 PM · Mia Chowdhury" meta="2 guests · window table preferred" status="Upcoming" tone="blue" />
          <QueueItem title="7:30 PM · Corporate booking" meta="10 guests · menu pre-order incomplete" status="Call now" tone="amber" />
          <QueueItem title="8:15 PM · Hasan family" meta="4 guests · high-chair requested" status="Prepared" tone="slate" />
        </div>
      </Panel>

      <Panel eyebrow="Arrival prep" title="Host stand focus">
        <div className="grid gap-3">
          <MiniMetric icon={Users} label="Guest Covers" value="54" tone="slate" />
          <MiniMetric icon={Clock3} label="Next Arrival" value="12 min" tone="amber" />
          <MiniMetric icon={Star} label="VIP Notes" value="3" tone="blue" />
        </div>
      </Panel>
    </div>
  );
}

function renderPageByRoute(route, user) {
  switch (route.path) {
    case "/operations/orders":
      return <OrdersOperationsPage />;
    case "/operations/reservations":
      return <ReservationsOperationsPage />;
    case "/operations/tables":
      return <TablesOperationsPage />;
    case "/menu/items":
      return <MenuItemsPage />;
    case "/menu/categories":
      return <MenuCategoriesPage />;
    case "/reports/revenue":
      return <RevenueReportPage />;
    case "/reports/top-items":
      return <TopItemsReportPage />;
    case "/reports/staff-performance":
      return <StaffPerformancePage />;
    case "/settings/staff-accounts":
      return <StaffAccountsPage user={user} />;
    case "/settings/profile":
      return <ProfilePage user={user} />;
    case "/staff/orders/new":
      return <NewOrderPage />;
    case "/staff/orders/active":
      return <ActiveOrdersPage />;
    case "/staff/orders/kitchen":
      return <KitchenDisplayPage />;
    case "/staff/reservations/today":
      return <TodayReservationsPage />;
    default:
      return null;
  }
}

function getStats(route, user) {
  const roleLabel = formatRole(user?.role);

  const statsByPath = {
    "/operations/orders": [
      ["Open now", "48", "Across all channels"],
      ["Over SLA", "7", "Needs intervention"],
      ["Ready to serve", "6", "Waiting on handoff"],
    ],
    "/operations/reservations": [
      ["Bookings", "17", "For tonight"],
      ["Covers", "84", "Reserved guests"],
      ["Walk-in load", "High", "After 8 PM"],
    ],
    "/operations/tables": [
      ["Occupied", "11/18", "Active dining room"],
      ["Reset queue", "3", "Need turnover"],
      ["Free seats", "24", "Available now"],
    ],
    "/menu/items": [
      ["Live items", "48", "Visible to staff"],
      ["Low stock", "6", "Monitor tonight"],
      ["Prep holds", "2", "Temporarily hidden"],
    ],
    "/menu/categories": [
      ["Categories", "4", "Published groups"],
      ["Needs cleanup", "2", "Structure updates"],
      ["Best section", "Mains", "Revenue leader"],
    ],
    "/reports/revenue": [
      ["Net sales", "$8,420", "Today so far"],
      ["Growth", "+12.4%", "Vs yesterday"],
      ["Best shift", "Dinner", "Highest contribution"],
    ],
    "/reports/top-items": [
      ["Top SKU", "Burger", "Highest volume"],
      ["Attach winner", "Dessert", "Best add-on rate"],
      ["Emerging", "Cold brew", "Fastest growth"],
    ],
    "/reports/staff-performance": [
      ["Top score", "98%", "Cashier team"],
      ["Throughput", "32", "Best waiter ticket count"],
      ["Coaching", "2 areas", "Need attention"],
    ],
    "/settings/staff-accounts": [
      ["Accounts", "23", "Total staff"],
      ["Active", "21", "Current access"],
      ["Deletion", user?.role === "admin" ? "Enabled" : "Restricted", user?.role === "admin" ? "Owner only" : "Manager safe mode"],
    ],
    "/settings/profile": [
      ["Role", roleLabel, "Current access"],
      ["Status", user?.is_active ? "Active" : "Inactive", "Account state"],
      ["Workspace", "Secure", "Cookie session"],
    ],
    "/staff/orders/new": [
      ["Table", "12", "Current draft"],
      ["Items", "3", "Ticket lines"],
      ["ETA", "16 min", "Kitchen estimate"],
    ],
    "/staff/orders/active": [
      ["Open now", "19", "Current workload"],
      ["Delayed", "4", "Need follow-up"],
      ["Ready", "6", "For pickup or serve"],
    ],
    "/staff/orders/kitchen": [
      ["Fire now", "6", "Urgent cook tickets"],
      ["Plating", "4", "Almost ready"],
      ["Pass window", "3", "Ready to hand off"],
    ],
    "/staff/reservations/today": [
      ["Arrivals", "12", "Remaining today"],
      ["VIP notes", "3", "Special handling"],
      ["Large parties", "2", "Need setup"],
    ],
  };

  return (statsByPath[route.path] ?? []).map(([label, value, note]) => (
    <StatCard key={label} label={label} value={value} note={note} />
  ));
}

function RoleSectionPage({ route, user }) {
  return (
    <PageShell
      eyebrow={route.eyebrow}
      title={route.title}
      description={route.description}
      actions={
        <Button asChild className="h-11 rounded-xl bg-black px-5 text-sm text-white hover:bg-black/90">
          <Link to={getDefaultPathForRole(user?.role)}>
            Return to my home
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
      stats={getStats(route, user)}
    >
      {renderPageByRoute(route, user)}
    </PageShell>
  );
}

export { RoleSectionPage };
