import type { Metadata } from "next";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SearchBar } from "@/components/ui/SearchBar";
import { searchProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search wholesale clothing products on JBH International.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const products = query ? await searchProducts(query) : [];

  return (
    <div className="bg-surface min-h-screen">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">
            Search Products
          </h1>
          <div className="mt-4 max-w-xl">
            <SearchBar defaultValue={query} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {query ? (
          <>
            <p className="mb-6 text-muted">
              {products.length} result{products.length !== 1 ? "s" : ""} for
              &ldquo;{query}&rdquo;
            </p>
            <ProductGrid
              products={products}
              emptyMessage={`No products found for "${query}".`}
            />
          </>
        ) : (
          <p className="text-center text-muted">
            Enter a search term to find products.
          </p>
        )}
      </div>
    </div>
  );
}
