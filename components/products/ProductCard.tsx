import Image from "next/image";
import Link from "next/link";
import { bnNumber, bnPrice, STORE_TYPE_LABEL } from "@/lib/labels";
import type { ProductFeedItem } from "@/lib/productFeed";

type ProductCardProps = {
  product: ProductFeedItem;
  /** Eager-load the first row of a page. */
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const typeLabel = product.seller_store_type ? STORE_TYPE_LABEL[product.seller_store_type] : null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-[border-color,box-shadow] hover:border-primary hover:shadow-[0_12px_28px_rgba(18,33,63,0.10)]"
    >
      <div className="relative aspect-square bg-surface">
        {product.productImg ? (
          <Image
            src={product.productImg}
            alt={product.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">ছবি নেই</div>
        )}
        {product.isSponsored ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-ink">
            স্পন্সরড
          </span>
        ) : typeLabel ? (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
              product.seller_store_type === "retail" ? "bg-teal" : "bg-navy"
            }`}
          >
            {typeLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-4 pt-3 sm:px-3.5">
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        <p className="text-lg font-extrabold sm:text-xl">
          {bnPrice(product.price)}{" "}
          <span className="text-xs font-medium text-muted">/ পিস</span>
        </p>
        <p className="text-[13px] font-semibold text-moq">MOQ {bnNumber(product.moq)} পিস</p>
      </div>
    </Link>
  );
}
