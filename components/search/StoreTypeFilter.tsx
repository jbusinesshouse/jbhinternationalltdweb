import Link from "next/link";
import type { CatalogStoreTypeFilter } from "@/lib/products";

const OPTIONS: { value: CatalogStoreTypeFilter; label: string }[] = [
  { value: "all", label: "সব" },
  { value: "wholesale", label: "পাইকারি" },
  { value: "retail", label: "খুচরা" },
];

type StoreTypeFilterProps = {
  query: string;
  value: CatalogStoreTypeFilter;
};

export function StoreTypeFilter({ query, value }: StoreTypeFilterProps) {
  return (
    <nav aria-label="সেলারের ধরন" className="flex gap-1 rounded-xl bg-[#E9ECF1] p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (opt.value !== "all") params.set("storeType", opt.value);
        return (
          <Link
            key={opt.value}
            href={`/search?${params.toString()}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-9 items-center rounded-[9px] px-3.5 text-sm ${
              active ? "bg-white font-bold shadow-sm" : "font-semibold text-foreground/80 hover:bg-white/60"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </nav>
  );
}
