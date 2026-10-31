import type { ProductFeedItem } from "@/lib/productFeed";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: ProductFeedItem[];
  emptyMessage?: string;
  /** How many leading cards to load eagerly (above the fold). */
  priorityCount?: number;
};

export function ProductGrid({
  products,
  emptyMessage = "কোনো পণ্য পাওয়া যায়নি।",
  priorityCount = 0,
}: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold">{emptyMessage}</p>
        <p className="mt-1 text-sm text-muted">অন্য শব্দ দিয়ে খুঁজুন বা অন্য ক্যাটাগরি দেখুন।</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < priorityCount} />
      ))}
    </div>
  );
}
