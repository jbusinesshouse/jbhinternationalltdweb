import Link from "next/link";
import type { CatalogStoreTypeFilter } from "@/lib/products";

const OPTIONS: { value: CatalogStoreTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
];

type StoreTypeFilterProps = {
  query: string;
  value: CatalogStoreTypeFilter;
};

export function StoreTypeFilter({ query, value }: StoreTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Seller type">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (opt.value !== "all") params.set("storeType", opt.value);
        const href = `/search?${params.toString()}`;

        return (
          <Link
            key={opt.value}
            href={href}
            role="tab"
            aria-selected={active}
            className={
              active
                ? "rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-muted hover:border-primary/40 hover:text-foreground"
            }
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
