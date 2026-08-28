"use client";

import { useCallback, useState } from "react";
import { BATCH_SIZE, ProductFeedItem } from "@/lib/productFeed";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "./ProductGrid";

type ProductFeedSectionProps = {
  initialProducts: ProductFeedItem[];
  organicIds: string[];
  initialOffset: number;
};

export function ProductFeedSection({
  initialProducts,
  organicIds,
  initialOffset,
}: ProductFeedSectionProps) {
  const [products, setProducts] = useState(initialProducts);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);

  const hasMore = offset < organicIds.length;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const batchIds = organicIds.slice(offset, offset + BATCH_SIZE);
      const res = await fetch("/api/products/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: batchIds }),
      });
      if (!res.ok) throw new Error("Failed to load products");

      const data = await res.json();
      setProducts((prev) => [...prev, ...data.products]);
      setOffset((prev) => prev + batchIds.length);
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, organicIds]);

  return (
    <div>
      <ProductGrid products={products} />

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More Products"}
          </Button>
        </div>
      )}
    </div>
  );
}
