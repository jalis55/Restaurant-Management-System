import { useMemo, useState } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { filters, products, statusStyles, thumbStyles } from "@/data/dashboard-data";
import { cn } from "@/lib/utils";

function ProductThumbnail({ name, tone }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold shadow-inner",
        thumbStyles[tone],
      )}
    >
      {name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")}
    </div>
  );
}

function ProductsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Active" && ["Scoping", "Quoting", "Production"].includes(product.status)) ||
        (activeFilter === "Draft" && product.status === "Quoting") ||
        (activeFilter === "Archived" && product.status === "Shipped");

      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  return (
    <PageShell
      eyebrow="Inventory"
      title="My products"
      description="Manage SKUs, monitor stock, and track incoming inventory."
      actions={
        <>
          <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none">
            <Download className="size-4" />
            Import
          </Button>
          <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white px-4 text-sm shadow-none">
            <Download className="size-4 rotate-180" />
            Export
          </Button>
          <Button className="h-11 rounded-xl bg-black px-5 text-sm text-white hover:bg-black/90">+ Add product</Button>
        </>
      }
      stats={
        <>
          <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Stocked</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">284</p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Incoming</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">590</p>
          </div>
        </>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-black/6 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                    activeFilter === filter ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-black/8 bg-white px-4 py-3 sm:min-w-[280px]">
                <Search className="size-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <Button variant="outline" className="h-12 rounded-xl border-black/8 px-4 shadow-none">
                <ArrowUpDown className="size-4" />
                Sort
              </Button>
              <Button variant="outline" className="h-12 rounded-xl border-black/8 px-4 shadow-none">
                + Add
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-black/6 text-left text-sm text-slate-500">
                <th className="w-[320px] px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Inventory (count)</th>
                <th className="px-6 py-4 font-medium">Incoming (count)</th>
                <th className="px-6 py-4 font-medium">Out of Stock</th>
                <th className="px-6 py-4 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id} className="border-b border-black/6 last:border-b-0 hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-black/15" />
                      <ProductThumbnail name={product.name} tone={product.tone} />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-slate-950">{product.name}</p>
                        <p className="mt-0.5 text-sm text-slate-400">SKU-{String(product.id).padStart(4, "0")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[product.status])}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] font-medium">
                    <span className={product.inventory === 0 ? "text-red-600" : "text-slate-950"}>
                      {product.inventory === 0 ? "0 in stock" : `${product.inventory} in stock`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-slate-950">{product.incoming}</td>
                  <td className="px-6 py-4 text-[15px] text-slate-950">{product.outOfStock}</td>
                  <td className="px-6 py-4 text-[15px] font-medium text-slate-950">{product.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Showing {visibleProducts.length} products from the latest inventory snapshot.</p>
        <p>Responsive layout optimized for desktop, tablet, and mobile.</p>
      </div>
    </PageShell>
  );
}

export { ProductsPage };
