import { Plus, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, StatCard } from "@/components/section-page-ui";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { createUser, deleteUser, listUsers } from "@/lib/api";

const defaultForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "waiter",
  is_active: true,
  password: "",
};

function formatApiError(errorData) {
  if (!errorData) {
    return "Something went wrong.";
  }

  if (typeof errorData === "string") {
    return errorData;
  }

  if (Array.isArray(errorData)) {
    return errorData.join(" ");
  }

  return Object.entries(errorData)
    .map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      return `${field.replaceAll("_", " ")}: ${text}`;
    })
    .join(" | ");
}

function SettingsStaffAccountsPage({ user }) {
  const isManager = user?.role === "manager";
  const { data: users, error, isLoading, setData: setUsers } = useAsyncData(() => listUsers());
  const [form, setForm] = useState(defaultForm);
  const [pageMessage, setPageMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const userList = users ?? [];

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setModalMessage("");

    try {
      const createdUser = await createUser(form);
      setUsers((currentUsers) => [...(currentUsers ?? []), createdUser].sort((left, right) => left.username.localeCompare(right.username)));
      setForm({ ...defaultForm });
      setPageMessage("Staff account created.");
      setModalMessage("Staff account created.");
      setIsCreateModalOpen(false);
    } catch (submitError) {
      setModalMessage(submitError?.data?.detail || formatApiError(submitError?.data) || submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(userId) {
    setBusyId(userId);
    setPageMessage("");

    try {
      await deleteUser(userId);
      setUsers((currentUsers) => currentUsers.filter((account) => account.id !== userId));
      setPageMessage("User deleted.");
    } catch (actionError) {
      setPageMessage(actionError?.data?.detail || actionError.message || "Unable to delete user.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Staff Accounts"
      description="Create and manage staff access, roles, and account setup for restaurant operations."
      stats={[
        <StatCard key="accounts" label="Accounts" value={String(userList.length)} note="Total staff" />,
        <StatCard key="active" label="Active" value={String(userList.filter((account) => account.is_active).length)} note="Current access" />,
        <StatCard key="delete" label="Deletion" value={isManager ? "Restricted" : "Enabled"} note={isManager ? "Manager safe mode" : "Owner only"} />,
      ]}
      actions={
        <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" onClick={() => setIsCreateModalOpen(true)} type="button">
          <Plus className="size-4" />
          Create user
        </Button>
      }
    >
      {pageMessage ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{pageMessage}</div> : null}
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DataState isLoading={isLoading} error={error} empty={false} loadingLabel="Loading staff accounts...">
          <Panel eyebrow="Access control" title="Staff account workspace">
            <div className="space-y-3">
              {userList.map((account) => (
                <div key={account.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/6 p-4">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{account.first_name || account.last_name ? `${account.first_name} ${account.last_name}`.trim() : account.username}</p>
                    <p className="mt-1 text-sm text-slate-500">{account.email || "No email"} · {account.phone || "No phone"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{account.role}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${account.is_active ? "bg-lime-100 text-lime-900" : "bg-red-100 text-red-900"}`}>
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                    {!isManager && account.id !== user?.id ? (
                      <button
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700"
                        disabled={busyId === account.id}
                        onClick={() => handleDelete(account.id)}
                        type="button"
                      >
                        {busyId === account.id ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </DataState>

        <div className="space-y-4">
          {isManager ? (
            <Panel eyebrow="Guardrail" title="Manager restriction">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-base font-semibold text-amber-950">
                  <ShieldAlert className="size-4" />
                  Destructive user deletion stays disabled
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900/80">
                  Managers can create and update staff accounts, but permanent delete actions remain unavailable.
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

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-black/8 bg-[#fbfbf8] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.24)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Create user</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">New staff account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add a new account and assign the correct restaurant role from the backend-supported role list.
                </p>
              </div>

              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:bg-slate-50"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setForm({ ...defaultForm });
                  setModalMessage("");
                }}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {modalMessage ? (
                <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">
                  {modalMessage}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["username", "Username"],
                  ["email", "Email"],
                  ["first_name", "First name"],
                  ["last_name", "Last name"],
                  ["phone", "Phone"],
                  ["password", "Password"],
                ].map(([name, label]) => (
                  <label key={name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
                    <input
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
                      name={name}
                      onChange={handleChange}
                      required={name !== "phone"}
                      type={name === "password" ? "password" : "text"}
                      value={form[name]}
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
                  <select className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none" name="role" onChange={handleChange} value={form.role}>
                    {(isManager ? ["manager", "waiter", "kitchen"] : ["admin", "manager", "waiter", "kitchen"]).map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-700">
                  <input checked={form.is_active} name="is_active" onChange={handleChange} type="checkbox" />
                  Active account
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setForm({ ...defaultForm });
                    setModalMessage("");
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button className="h-11 rounded-xl bg-slate-950 px-5 text-sm text-white hover:bg-slate-900" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Creating..." : "Create account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export { SettingsStaffAccountsPage };
