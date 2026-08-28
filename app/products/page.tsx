import type { Metadata } from "next";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { ProductGrid } from "@/components/products/ProductGrid";
import { FeaturedStores } from "@/components/stores/FeaturedStores";
import { fetchCategories, fetchSubcategories } from "@/lib/categories";
import { fetchActiveFeaturedStores } from "@/lib/featuredStores";
import { fetchProductFeed } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse wholesale clothing products from trusted Bangladeshi suppliers. No login required.",
};

type ProductsPageProps = {
  searchParams: Promise<{ category?: string; subcategory?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categoryId = params.category;
  const subcategoryId = params.subcategory;

  const [categories, subcategories, products, stores] = await Promise.all([
    fetchCategories(),
    fetchSubcategories(),
    fetchProductFeed({
      categoryId,
      subcategoryId,
      limit: 40,
    }),
    !categoryId ? fetchActiveFeaturedStores() : Promise.resolve([]),
  ]);

  return (
    <div className="bg-surface min-h-screen">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">
            Wholesale Products
          </h1>
          <p className="mt-2 text-muted">
            Explore our full catalog — no account needed to browse
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <CategoryFilter
          categories={categories}
          subcategories={subcategories}
          selectedCategoryId={categoryId}
          selectedSubcategoryId={subcategoryId}
        />

        {!categoryId && stores.length > 0 && (
          <div className="mt-8">
            <FeaturedStores stores={stores} />
          </div>
        )}

        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
