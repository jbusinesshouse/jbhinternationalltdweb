"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type ProductImage = {
  image_url: string;
  is_main: boolean;
};

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
};

function ChevronLeft() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length]
  );

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
      if (e.key === "ArrowRight") goTo(activeIndex + 1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, activeIndex, goTo, closeLightbox]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-surface text-muted">
        No image available
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="group relative aspect-square bg-surface">
          <button
            type="button"
            onClick={() => openLightbox(activeIndex)}
            className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`View ${productName} image full screen`}
          />
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
                className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
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
                onClick={() => openLightbox(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors cursor-zoom-in ${
                  i === activeIndex
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
                aria-label={`View image ${i + 1} full screen`}
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

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image viewer`}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <p className="truncate text-sm font-medium">
              {productName}
              {images.length > 1 && (
                <span className="ml-2 text-white/60">
                  {activeIndex + 1} / {images.length}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={closeLightbox}
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
              aria-label="Close full screen view"
            >
              <CloseIcon />
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-4"
            onClick={closeLightbox}
          >
            <div
              className="relative h-full w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activeImage.image_url}
                alt={`${productName} - image ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(activeIndex - 1);
                  }}
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
                  aria-label="Previous image"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(activeIndex + 1);
                  }}
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
                  aria-label="Next image"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex shrink-0 justify-center gap-2 px-4 pb-6">
              {images.map((img, i) => (
                <button
                  key={img.image_url}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`relative h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14 ${
                    i === activeIndex
                      ? "border-primary"
                      : "border-white/30 hover:border-white/60"
                  }`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <Image
                    src={img.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
