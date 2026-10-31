import type { Metadata } from "next";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { ProductFeedSection } from "@/components/products/ProductFeedSection";
import { fetchCategories, fetchSubcategories } from "@/lib/categories";
import { categoryLabel } from "@/lib/labels";
import { fetchInitialProductFeed, parseCatalogStoreType } from "@/lib/products";

export const metadata: Metadata = {
  title: "সব পণ্য",
  description:
    "বাংলাদেশের পাইকারি ও খুচরা সেলারদের পোশাক — ভ্যাটসহ দাম, MOQ অনুযায়ী অর্ডার। Browse wholesale clothing from Bangladeshi suppliers.",
};

type ProductsPageProps = {
  searchParams: Promise<{ category?: string; subcategory?: string; storeType?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categoryId = params.category;
  const subcategoryId = params.subcategory;
  const storeType = parseCatalogStoreType(params.storeType);

  const [categories, subcategories, feed] = await Promise.all([
    fetchCategories(),
    fetchSubcategories(),
    fetchInitialProductFeed({ categoryId, subcategoryId, storeType }),
  ]);

  const category = categories.find((c) => c.id === categoryId);
  const subcategory = subcategories.find((s) => s.id === subcategoryId);
  const title = subcategory
    ? subcategory.name
    : category
      ? `${categoryLabel(category.name)} পোশাক`
      : storeType === "wholesale"
        ? "পাইকারি পণ্য"
        : storeType === "retail"
          ? "খুচরা পণ্য"
          : "সব পণ্য";
  const total = feed.organicIds.length + feed.products.filter((p) => p.isSponsored).length;

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {total > 0 ? `${total.toLocaleString("bn-BD")}টি পণ্য · ` : ""}সব দাম ভ্যাটসহ, প্রতি পিস
          </p>
        </div>
      </div>

      <CategoryFilter
        categories={categories}
        subcategories={subcategories}
        selectedCategoryId={categoryId}
        selectedSubcategoryId={subcategoryId}
        storeType={storeType}
      />

      <ProductFeedSection
        initialProducts={feed.products}
        organicIds={feed.organicIds}
        initialOffset={feed.nextOffset}
      />
    </div>
  );
}
