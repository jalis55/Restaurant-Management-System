import { CalendarClock, FileSpreadsheet, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";

function NewRfqPage() {
  return (
    <PageShell
      eyebrow="Procurement"
      title="New RFQ"
      description="A dedicated page for drafting a fresh request for quotation."
      actions={
        <>
          <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none">
            Save draft
          </Button>
          <Button className="h-11 rounded-xl bg-black px-5 text-sm text-white hover:bg-black/90">
            <Send className="size-4" />
            Send RFQ
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Supplier name</span>
              <input className="rounded-2xl border border-black/8 bg-[#f8f8f6] px-4 py-3 outline-none" placeholder="Made Supply Co." />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">RFQ title</span>
              <input className="rounded-2xl border border-black/8 bg-[#f8f8f6] px-4 py-3 outline-none" placeholder="Spring body oil restock" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Due date</span>
              <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-[#f8f8f6] px-4 py-3">
                <CalendarClock className="size-4 text-slate-400" />
                <input className="w-full bg-transparent outline-none" placeholder="April 12, 2026" />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Reference sheet</span>
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-black/12 bg-[#f8f8f6] px-4 py-3 text-slate-500">
                <FileSpreadsheet className="size-4" />
                Upload pricing file
              </div>
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea
              className="min-h-40 rounded-[24px] border border-black/8 bg-[#f8f8f6] px-4 py-3 outline-none"
              placeholder="Add packaging details, requested MOQ, shipping expectations, and any negotiation notes."
            />
          </label>
        </div>

        <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Checklist</p>
          <div className="mt-4 space-y-3">
            {[
              "Confirm supplier lead time",
              "Attach product specification sheet",
              "Request freight and packaging pricing",
              "Add internal approval owner",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#f6f6f3] p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-black/15" />
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export { NewRfqPage };
