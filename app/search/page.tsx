import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { StoreTypeFilter } from "@/components/search/StoreTypeFilter";
import { SearchBar } from "@/components/ui/SearchBar";
import { bnNumber } from "@/lib/labels";
import { parseCatalogStoreType, searchProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "পণ্য খুঁজুন",
  description: "JBH-এ পাইকারি ও খুচরা পোশাক খুঁজুন। Search wholesale clothing on JBH International.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string; storeType?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const storeType = parseCatalogStoreType(params.storeType);
  const products = query ? await searchProducts(query, { storeType }) : [];

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
      {query ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">“{query}”</h1>
            <p className="mt-1 text-sm text-muted">{bnNumber(products.length)}টি পণ্য পাওয়া গেছে</p>
          </div>
          <StoreTypeFilter query={query} value={storeType} />
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-[22px] border border-border bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">পণ্য খুঁজুন</h1>
          <Suspense fallback={<div className="h-12 rounded-2xl border-2 border-primary" />}>
            <SearchBar />
          </Suspense>
          <p className="text-sm text-muted">যেমন: জার্সি, পোলো শার্ট, জিন্স, Baby wear</p>
        </div>
      )}

      {query && (
        <ProductGrid
          products={products}
          priorityCount={5}
          emptyMessage={`“${query}” নামে কোনো পণ্য পাওয়া যায়নি।`}
        />
      )}
    </div>
  );
}
