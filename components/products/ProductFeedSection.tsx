"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BATCH_SIZE, ProductFeedItem } from "@/lib/productFeed";
import { ProductGrid } from "./ProductGrid";

type ProductFeedSectionProps = {
  initialProducts: ProductFeedItem[];
  organicIds: string[];
  initialOffset: number;
};

function FeedFooterLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden
      />
      <p className="text-sm text-muted">Loading more products…</p>
    </div>
  );
}

export function ProductFeedSection({
  initialProducts,
  organicIds,
  initialOffset,
}: ProductFeedSectionProps) {
  const [products, setProducts] = useState(initialProducts);
  const [offset, setOffset] = useState(initialOffset);
  const [loadingMore, setLoadingMore] = useState(false);

  const isFetchingRef = useRef(false);
  const offsetRef = useRef(initialOffset);
  const organicIdsRef = useRef(organicIds);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  organicIdsRef.current = organicIds;

  const hasMore = offset < organicIds.length;

  const loadMore = useCallback(async () => {
    const ids = organicIdsRef.current;
    if (isFetchingRef.current || offsetRef.current >= ids.length) return;

    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const start = offsetRef.current;
      const batchIds = ids.slice(start, start + BATCH_SIZE);
      if (batchIds.length === 0) return;

      const res = await fetch("/api/products/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: batchIds }),
      });
      if (!res.ok) throw new Error("Failed to load products");

      const data = await res.json();
      setProducts((prev) => [...prev, ...data.products]);
      const nextOffset = start + batchIds.length;
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
    } catch {
      // User can scroll again to retry
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);

      requestAnimationFrame(() => {
        const sentinel = sentinelRef.current;
        const totalIds = organicIdsRef.current;
        if (
          !sentinel ||
          isFetchingRef.current ||
          offsetRef.current >= totalIds.length
        ) {
          return;
        }
        const rect = sentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 300) {
          loadMoreRef.current();
        }
      });
    }
  }, []);

  loadMoreRef.current = loadMore;

  useEffect(() => {
    offsetRef.current = initialOffset;
    setOffset(initialOffset);
    setProducts(initialProducts);
  }, [initialProducts, initialOffset, organicIds]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const onIntersect = (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        loadMoreRef.current();
      }
    };

    const observer = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: "300px",
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [organicIds]);

  return (
    <div>
      <ProductGrid products={products} />

      {loadingMore && <FeedFooterLoader />}

      {hasMore && (
        <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      )}
    </div>
  );
}
