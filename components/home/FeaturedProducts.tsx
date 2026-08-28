import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFeedItem } from "@/lib/productFeed";

type FeaturedProductsProps = {
  products: ProductFeedItem[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Trending Products
            </h2>
            <p className="mt-2 text-muted">
              Discover wholesale clothing — browse freely, no account needed
            </p>
          </div>
          <Button href="/products" variant="outline" className="hidden sm:inline-flex">
            View All
          </Button>
        </div>

        <ProductGrid products={products} />

        <div className="mt-8 text-center sm:hidden">
          <Button href="/products" variant="outline">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
}
