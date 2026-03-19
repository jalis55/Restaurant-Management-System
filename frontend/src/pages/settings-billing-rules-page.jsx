import { Percent, ReceiptText } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Panel, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { getBillingSettings, updateBillingSettings } from "@/lib/api";

function SettingsBillingRulesPage() {
  const { data: billingSettings, error, isLoading, setData } = useAsyncData(() => getBillingSettings());
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSettings = billingSettings ?? { tax_percentage: "0.00", service_charge_percentage: "0.00" };
  const activeForm = form ?? {
    tax_percentage: Number(currentSettings.tax_percentage ?? 0).toFixed(2),
    service_charge_percentage: Number(currentSettings.service_charge_percentage ?? 0).toFixed(2),
  };

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...(currentForm ?? activeForm),
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const updatedSettings = await updateBillingSettings(activeForm);
      setData(updatedSettings);
      setForm({
        tax_percentage: Number(updatedSettings.tax_percentage ?? 0).toFixed(2),
        service_charge_percentage: Number(updatedSettings.service_charge_percentage ?? 0).toFixed(2),
      });
      setMessage("Billing setup updated.");
    } catch (submitError) {
      setMessage(submitError?.data?.detail || submitError.message || "Unable to update billing setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Billing Rules"
      description="Set the restaurant-wide tax and service charge once here. Final billing will use these values automatically."
      stats={[
        <StatCard key="tax" label="Tax" value={`${Number(currentSettings.tax_percentage ?? 0).toFixed(2)}%`} note="Global rate" />,
        <StatCard key="service" label="Service" value={`${Number(currentSettings.service_charge_percentage ?? 0).toFixed(2)}%`} note="Global rate" />,
        <StatCard key="mode" label="Applied in billing" value="Automatic" note="Locked at checkout" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel eyebrow="Billing setup" title="Tax and service charge">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Tax percentage</span>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                  disabled={isLoading}
                  min="0"
                  name="tax_percentage"
                  onChange={handleChange}
                  step="0.01"
                  type="number"
                  value={activeForm.tax_percentage}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Service charge percentage</span>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                  disabled={isLoading}
                  min="0"
                  name="service_charge_percentage"
                  onChange={handleChange}
                  step="0.01"
                  type="number"
                  value={activeForm.service_charge_percentage}
                />
              </label>
            </div>

            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSubmitting || isLoading} type="submit">
              {isSubmitting ? "Saving..." : "Save billing rules"}
            </button>
          </form>
        </Panel>

        <Panel eyebrow="Behavior" title="How this applies">
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
              <p className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <ReceiptText className="size-4" />
                Auto-applied at billing
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Managers can no longer edit tax or service charge on the finalize bill screen.</p>
            </div>
            <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
              <p className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <Percent className="size-4" />
                Menu offers remain separate
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Per-item menu offers are still applied automatically before the manager’s final bill discount.</p>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

export { SettingsBillingRulesPage };
