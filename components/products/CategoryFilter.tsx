import Link from "next/link";
import type { Category, Subcategory } from "@/lib/categories";
import { categoryLabel } from "@/lib/labels";
import type { CatalogStoreTypeFilter } from "@/lib/products";

type CategoryFilterProps = {
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  storeType?: CatalogStoreTypeFilter;
  basePath?: string;
};

const STORE_TYPES: { value: CatalogStoreTypeFilter; label: string }[] = [
  { value: "all", label: "সব" },
  { value: "wholesale", label: "পাইকারি" },
  { value: "retail", label: "খুচরা" },
];

export function CategoryFilter({
  categories,
  subcategories,
  selectedCategoryId,
  selectedSubcategoryId,
  storeType = "all",
  basePath = "/products",
}: CategoryFilterProps) {
  const filteredSubs = selectedCategoryId
    ? subcategories.filter((s) => s.category_id === selectedCategoryId)
    : [];

  const buildUrl = (next: { cat?: string; sub?: string; type?: CatalogStoreTypeFilter }) => {
    const params = new URLSearchParams();
    if (next.cat) params.set("category", next.cat);
    if (next.sub) params.set("subcategory", next.sub);
    if (next.type && next.type !== "all") params.set("storeType", next.type);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
      active
        ? "border-primary bg-primary-soft font-bold text-moq"
        : "border-border bg-white font-semibold text-foreground hover:border-primary"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="ক্যাটাগরি" className="scrollbar-hide flex min-w-0 gap-2 overflow-x-auto pb-1">
          <Link href={buildUrl({ type: storeType })} className={pill(!selectedCategoryId)}>
            সব ক্যাটাগরি
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ cat: cat.id, type: storeType })}
              className={pill(selectedCategoryId === cat.id)}
            >
              {categoryLabel(cat.name, true)}
            </Link>
          ))}
        </nav>
        <nav aria-label="পণ্যের ধরন" className="flex gap-1 rounded-xl bg-[#E9ECF1] p-1">
          {STORE_TYPES.map((t) => (
            <Link
              key={t.value}
              href={buildUrl({ cat: selectedCategoryId, sub: selectedSubcategoryId, type: t.value })}
              aria-current={storeType === t.value ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-[9px] px-3.5 text-sm ${
                storeType === t.value ? "bg-white font-bold shadow-sm" : "font-semibold text-foreground/80 hover:bg-white/60"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {filteredSubs.length > 0 && (
        <nav aria-label="সাব-ক্যাটাগরি" className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <Link
            href={buildUrl({ cat: selectedCategoryId, type: storeType })}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] ${
              !selectedSubcategoryId ? "bg-navy font-bold text-white" : "bg-white font-semibold text-foreground ring-1 ring-border hover:ring-primary"
            }`}
          >
            সব
          </Link>
          {filteredSubs.map((sub) => (
            <Link
              key={sub.id}
              href={buildUrl({ cat: selectedCategoryId, sub: sub.id, type: storeType })}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] ${
                selectedSubcategoryId === sub.id
                  ? "bg-navy font-bold text-white"
                  : "bg-white font-semibold text-foreground ring-1 ring-border hover:ring-primary"
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
