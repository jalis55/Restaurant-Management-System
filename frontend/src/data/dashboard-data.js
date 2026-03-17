export const filters = ["All", "Active", "Draft", "Archived"];

export const products = [
  { id: 1, name: "Hydrate replenish (body oil)", status: "Scoping", inventory: 45, incoming: 12, outOfStock: 11, grade: "A", tone: "rose" },
  { id: 2, name: "Hydrate replenish", status: "Scoping", inventory: 45, incoming: 65, outOfStock: 11, grade: "A", tone: "stone" },
  { id: 3, name: "Illumination (mask)", status: "Quoting", inventory: 45, incoming: 35, outOfStock: 11, grade: "B", tone: "sage" },
  { id: 4, name: "Act+ acne hair mask", status: "Scoping", inventory: 45, incoming: 24, outOfStock: 11, grade: "A", tone: "charcoal" },
  { id: 5, name: "Mecca cosmetica", status: "Production", inventory: 0, incoming: 22, outOfStock: 11, grade: "A", tone: "sand" },
  { id: 6, name: "Hylamide (Glow)", status: "Scoping", inventory: 45, incoming: 86, outOfStock: 11, grade: "B", tone: "gold" },
  { id: 7, name: "Mecca cosmetica (body oil)", status: "Scoping", inventory: 45, incoming: 68, outOfStock: 11, grade: "A", tone: "sky" },
  { id: 8, name: "Hydrate replenish (body oil)", status: "Production", inventory: 0, incoming: 70, outOfStock: 11, grade: "C", tone: "rose" },
  { id: 9, name: "Illumination (mask)", status: "Scoping", inventory: 45, incoming: 56, outOfStock: 11, grade: "A", tone: "sage" },
  { id: 10, name: "Mecca cosmetica (body oil)", status: "Shipped", inventory: 0, incoming: 72, outOfStock: 11, grade: "A", tone: "sand" },
  { id: 11, name: "Hylamide (Glow)", status: "Scoping", inventory: 45, incoming: 80, outOfStock: 11, grade: "B", tone: "gold" },
];

export const statusStyles = {
  Scoping: "bg-sky-100 text-sky-700",
  Quoting: "bg-emerald-100 text-emerald-700",
  Production: "bg-amber-100 text-amber-700",
  Shipped: "bg-slate-100 text-slate-700",
};

export const thumbStyles = {
  rose: "from-rose-100 via-white to-pink-100 text-rose-500",
  stone: "from-stone-200 via-white to-zinc-100 text-stone-500",
  sage: "from-lime-100 via-white to-emerald-100 text-lime-600",
  charcoal: "from-slate-200 via-white to-zinc-100 text-slate-600",
  sand: "from-amber-100 via-white to-orange-100 text-amber-600",
  gold: "from-yellow-100 via-white to-amber-100 text-yellow-600",
  sky: "from-sky-100 via-white to-cyan-100 text-sky-600",
};
