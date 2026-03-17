import { useState } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listMenuItems, toggleMenuItemAvailability } from "@/lib/api";
import { cn } from "@/lib/utils";

function MenuItemsPage() {
  const { data: items, error, isLoading, setData: setItems } = useAsyncData(() => listMenuItems());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  const itemList = items ?? [];
  const availableCount = itemList.filter((item) => item.is_available).length;
  const featuredCount = itemList.filter((item) => item.is_featured).length;

  async function handleToggle(itemId) {
    setBusyId(itemId);
    setMessage("");

    try {
      const updatedItem = await toggleMenuItemAvailability(itemId);
      setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? updatedItem : item)));
      setMessage(`${updatedItem.name} availability updated.`);
    } catch (actionError) {
      setMessage(actionError?.data?.detail || actionError.message || "Unable to update item availability.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Menu"
      title="Menu Items"
      description="Manage item availability, pricing, prep details, and what the floor can currently sell."
      stats={[
        <StatCard key="total" label="Items" value={String(itemList.length)} note="Total menu records" />,
        <StatCard key="available" label="Available" value={String(availableCount)} note="Currently sellable" />,
        <StatCard key="featured" label="Featured" value={String(featuredCount)} note="Promoted items" />,
      ]}
    >
      {message ? <div className="mb-4 rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <DataState isLoading={isLoading} error={error} empty={!itemList.length} loadingLabel="Loading menu items...">
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
                    <th className="px-5 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itemList.map((item) => (
                    <tr key={item.id} className="border-b border-black/6 last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-[15px] font-medium text-slate-950">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.description || "No description"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{item.category_name}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{item.price}</td>
                      <td className="px-5 py-4">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.is_available ? "bg-lime-100 text-lime-900" : "bg-red-100 text-red-900")}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          className="rounded-xl border border-black/8 bg-[#f7f7f4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-950 hover:text-white"
                          disabled={busyId === item.id}
                          onClick={() => handleToggle(item.id)}
                          type="button"
                        >
                          {busyId === item.id ? "Updating..." : item.is_available ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel eyebrow="Highlights" title="Featured and unavailable">
            <div className="space-y-3">
              {itemList
                .filter((item) => item.is_featured || !item.is_available)
                .slice(0, 5)
                .map((item) => (
                  <QueueItem
                    key={item.id}
                    title={item.name}
                    meta={`${item.category_name} · Prep ${item.preparation_time} min`}
                    status={item.is_available ? "Featured" : "Unavailable"}
                    tone={item.is_available ? "lime" : "red"}
                  />
                ))}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { MenuItemsPage };
