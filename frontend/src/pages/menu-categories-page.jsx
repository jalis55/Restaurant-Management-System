import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";
import { Panel, QueueItem, StatCard } from "@/components/section-page-ui";
import { useAsyncData } from "@/hooks/use-async-data";
import { listCategories } from "@/lib/api";

function MenuCategoriesPage() {
  const { data: categories, error, isLoading } = useAsyncData(() => listCategories());
  const categoryList = categories ?? [];

  return (
    <PageShell
      eyebrow="Menu"
      title="Menu Categories"
      description="Organize the structure of the menu so item groupings stay clean and fast to manage."
      stats={[
        <StatCard key="categories" label="Categories" value={String(categoryList.length)} note="Published groups" />,
        <StatCard key="active" label="Active" value={String(categoryList.filter((category) => category.is_active).length)} note="Visible to staff" />,
        <StatCard key="items" label="Linked items" value={String(categoryList.reduce((sum, category) => sum + (category.items_count || 0), 0))} note="Across categories" />,
      ]}
    >
      <DataState isLoading={isLoading} error={error} empty={!categoryList.length} loadingLabel="Loading categories...">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel eyebrow="Structure" title="Category organization">
            <div className="grid gap-3">
              {categoryList.map((category) => (
                <div key={category.id} className="rounded-2xl border border-black/6 bg-[#f7f7f4] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{category.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{category.description || "No description"}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{category.items_count} items</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Status" title="Category health">
            <div className="space-y-3">
              {categoryList.map((category) => (
                <QueueItem
                  key={category.id}
                  title={category.name}
                  meta={`Display order ${category.display_order}`}
                  status={category.is_active ? "Active" : "Inactive"}
                  tone={category.is_active ? "lime" : "red"}
                />
              ))}
            </div>
          </Panel>
        </div>
      </DataState>
    </PageShell>
  );
}

export { MenuCategoriesPage };
