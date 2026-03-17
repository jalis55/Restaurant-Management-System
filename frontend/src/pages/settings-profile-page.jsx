import { Users } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Panel, StatCard } from "@/components/section-page-ui";
import { changePassword } from "@/lib/api";
import { formatRole } from "@/lib/formatters";

function SettingsProfilePage({ user }) {
  const [form, setForm] = useState({ old_password: "", new_password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await changePassword(form);
      setMessage(response.detail);
      setForm({ old_password: "", new_password: "" });
    } catch (submitError) {
      setMessage(submitError?.data?.detail || JSON.stringify(submitError?.data || {}) || submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Profile"
      description="Update your profile, contact information, and the account details used across the workspace."
      stats={[
        <StatCard key="role" label="Role" value={formatRole(user?.role)} note="Current access" />,
        <StatCard key="status" label="Status" value={user?.is_active ? "Active" : "Inactive"} note="Account state" />,
        <StatCard key="session" label="Workspace" value="Secure" note="Cookie session" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
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

        <Panel eyebrow="Security" title="Change password">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Current password</span>
              <input
                className="w-full rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3 text-sm outline-none"
                name="old_password"
                onChange={handleChange}
                type="password"
                value={form.old_password}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
              <input
                className="w-full rounded-2xl border border-black/8 bg-[#f7f7f4] px-4 py-3 text-sm outline-none"
                name="new_password"
                onChange={handleChange}
                type="password"
                value={form.new_password}
              />
            </label>

            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        </Panel>
      </div>
    </PageShell>
  );
}

export { SettingsProfilePage };
