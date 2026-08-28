import { ProductFeedItem } from "@/lib/productFeed";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: ProductFeedItem[];
  emptyMessage?: string;
};

export function ProductGrid({
  products,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
