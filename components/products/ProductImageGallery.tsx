"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

type ProductImage = {
  image_url: string;
  is_main: boolean;
};

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length]
  );

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-surface text-muted">
        No image available
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="group relative aspect-square bg-surface">
        <Image
          src={activeImage.image_url}
          alt={`${productName} - image ${activeIndex + 1}`}
          fill
          className="object-cover"
          priority={activeIndex === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === activeIndex ? "bg-primary" : "bg-white/70"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-4">
          {images.map((img, i) => (
            <button
              key={img.image_url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? "border-primary" : "border-border hover:border-primary/50"
              }`}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              <Image
                src={img.image_url}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
