import Image from "next/image";
import Link from "next/link";
import { ProductFeedItem } from "@/lib/productFeed";

type ProductCardProps = {
  product: ProductFeedItem;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-surface">
        {product.productImg ? (
          <Image
            src={product.productImg}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <svg
              className="h-16 w-16 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {product.isSponsored && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Promoted
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {product.isSponsored && (
          <span className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            Promoted
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 text-base font-bold text-foreground">
          BDT {product.price}
        </p>
        <p className="mt-0.5 text-xs text-muted">MOQ {product.moq}</p>
      </div>
    </Link>
  );
}
