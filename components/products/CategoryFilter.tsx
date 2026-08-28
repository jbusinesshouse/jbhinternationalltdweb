"use client";

import Link from "next/link";
import { Category, Subcategory } from "@/lib/categories";

const ACCENTS = [
  "#f5832b",
  "#0f766e",
  "#1d4ed8",
  "#b45309",
  "#be123c",
  "#4338ca",
];

type CategoryFilterProps = {
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  basePath?: string;
};

export function CategoryFilter({
  categories,
  subcategories,
  selectedCategoryId,
  selectedSubcategoryId,
  basePath = "/products",
}: CategoryFilterProps) {
  const filteredSubs = selectedCategoryId
    ? subcategories.filter((s) => s.category_id === selectedCategoryId)
    : [];

  const buildUrl = (catId?: string, subId?: string) => {
    const params = new URLSearchParams();
    if (catId) params.set("category", catId);
    if (subId) params.set("subcategory", subId);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="space-y-3">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <Link
          href={basePath}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !selectedCategoryId
              ? "bg-primary text-white"
              : "bg-surface text-foreground hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={buildUrl(cat.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategoryId === cat.id
                ? "text-white"
                : "bg-surface text-foreground hover:bg-gray-200"
            }`}
            style={
              selectedCategoryId === cat.id
                ? { backgroundColor: ACCENTS[i % ACCENTS.length] }
                : undefined
            }
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {filteredSubs.length > 0 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <Link
            href={buildUrl(selectedCategoryId)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              !selectedSubcategoryId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-white text-foreground hover:border-gray-300"
            }`}
          >
            All in category
          </Link>
          {filteredSubs.map((sub) => (
            <Link
              key={sub.id}
              href={buildUrl(selectedCategoryId, sub.id)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedSubcategoryId === sub.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-white text-foreground hover:border-gray-300"
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
