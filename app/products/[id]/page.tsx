import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductOrderActions } from "@/components/products/ProductOrderActions";
import { fetchGuestCheckoutEnabled } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { BRAND } from "@/lib/constants";
import { bnNumber, bnPrice, categoryLabel, STORE_TYPE_LABEL } from "@/lib/labels";
import { fetchProductById, fetchProductFeed } from "@/lib/products";
import { htmlToPlainText, sanitizeDescriptionHtml } from "@/lib/sanitizeHtml";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);
  if (!product) return { title: "পণ্য পাওয়া যায়নি" };

  const mainImage = product.product_images.find((img) => img.is_main) ?? product.product_images[0];
  const summary = `${bnPrice(product.price)} / পিস (ভ্যাটসহ) · MOQ ${bnNumber(product.moq)} পিস`;
  return {
    title: product.name,
    description: `${summary}. ${htmlToPlainText(product.description).slice(0, 140)}`,
    openGraph: {
      title: product.name,
      description: summary,
      images: mainImage ? [{ url: mainImage.image_url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, { user, profile }, guestCheckoutEnabled] = await Promise.all([
    fetchProductById(id),
    getAuthSession(),
    fetchGuestCheckoutEnabled(),
  ]);
  if (!product) notFound();

  const images = [...product.product_images].sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
  const related = product.category_id
    ? (await fetchProductFeed({ categoryId: product.category_id, limit: 6 }))
        .filter((p) => p.id !== product.id)
        .slice(0, 5)
    : [];

  const descriptionHtml = sanitizeDescriptionHtml(product.description);
  const typeLabel = product.seller_store_type ? STORE_TYPE_LABEL[product.seller_store_type] : null;
  const vatPercent = Math.round((product.vat_rate ?? 0) * 100);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: htmlToPlainText(product.description) || product.name,
    image: images.map((img) => img.image_url),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
    },
    brand: { "@type": "Brand", name: BRAND.name },
    ...(product.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } }
      : {}),
  };

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-5 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">হোম</Link>
        <span aria-hidden="true">›</span>
        <Link href="/products" className="hover:text-foreground">পণ্য</Link>
        {product.categories && (
          <>
            <span aria-hidden="true">›</span>
            <Link href={`/products?category=${product.category_id}`} className="hover:text-foreground">
              {categoryLabel(product.categories.name)} পোশাক
            </Link>
          </>
        )}
        <span aria-hidden="true">›</span>
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <section className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[1_1_380px] lg:max-w-[540px]">
          <ProductImageGallery images={images} productName={product.name} />
        </div>

        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {typeLabel && (
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-bold ${
                  product.seller_store_type === "retail" ? "bg-teal-soft text-teal" : "bg-navy-soft text-navy"
                }`}
              >
                {typeLabel} · {product.seller_store_type === "retail" ? "Retail" : "Wholesale"}
              </span>
            )}
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[13px] font-semibold">ভ্যাটসহ দাম</span>
          </div>
          <h1 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">{product.name}</h1>
          <p className="-mt-2 text-sm text-muted">
            {product.rating.count > 0
              ? `★ ${product.rating.average.toFixed(1)} · ${bnNumber(product.rating.count)}টি রিভিউ`
              : "এখনো কোনো রিভিউ নেই"}
          </p>

          <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-primary-soft px-5 py-4">
            <div>
              <p className="text-[34px] font-extrabold leading-none tracking-tight">
                {bnPrice(product.price)} <span className="text-[15px] font-medium text-muted">/ পিস</span>
              </p>
              {vatPercent > 0 && (
                <p className="mt-2 text-[13px] text-muted">
                  বেস দাম {bnPrice(product.price_base)} + ভ্যাট {bnPrice(product.vat_amount)} ({bnNumber(vatPercent)}%)
                </p>
              )}
            </div>
            <span className="rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-moq">
              সর্বনিম্ন অর্ডার (MOQ): {bnNumber(product.moq)} পিস
            </span>
          </div>

          <ProductOrderActions
            product={{
              id: product.id,
              name: product.name,
              price: String(product.price),
              moq: product.moq,
              seller_id: product.seller_id,
              product_images: product.product_images,
            }}
            productVariants={product.product_variants}
            userId={user?.id ?? null}
            buyerProfile={profile ? { store_type: profile.store_type, status: profile.status } : null}
            guestCheckoutEnabled={guestCheckoutEnabled}
          />
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
          {product.seller && (
            <div className="flex flex-col gap-3.5 rounded-[18px] border border-border bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">বিক্রেতা</p>
              <div className="flex items-center gap-3">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-lg font-bold text-primary-strong">
                  {product.seller.avatar_url ? (
                    <Image src={product.seller.avatar_url} alt="" fill className="object-cover" sizes="56px" />
                  ) : (
                    product.seller.store_name.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-extrabold">{product.seller.store_name}</p>
                  <p className="text-sm text-muted">
                    {[product.seller.district, typeLabel ? `${typeLabel} সেলার` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <Link
                href={`/store/${product.seller.id}`}
                className="flex h-[46px] items-center justify-center rounded-xl border-[1.5px] border-[#D1D5DB] font-bold hover:border-primary"
              >
                স্টোর দেখুন
              </Link>
            </div>
          )}
          <ul className="flex flex-col gap-3 rounded-[18px] border border-border bg-white p-5 text-sm">
            {["দাম ভ্যাটসহ — চেকআউটে বাড়তি কিছু নেই", "সাইজ ও রং মিলিয়ে এক অর্ডারে", "অর্ডারের পর সেলার আপনার সাথে যোগাযোগ করবেন"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="font-extrabold text-teal">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border bg-white p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-extrabold">বিবরণ</h2>
          {descriptionHtml ? (
            <div
              className="prose prose-sm max-w-none leading-relaxed [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            <p className="text-muted">সেলার কোনো বিবরণ দেননি।</p>
          )}
        </div>
        <div className="rounded-[20px] border border-border bg-white p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-extrabold">রিভিউ ({bnNumber(product.rating.count)})</h2>
          {product.reviews.length === 0 ? (
            <p className="text-muted">এখনো কোনো রিভিউ নেই। পণ্য কেনার পর প্রথম রিভিউটি আপনিই দিন।</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {product.reviews.map((r) => {
                const buyer = (r as { buyer?: { full_name?: string | null } }).buyer;
                const images = ((r as { image_urls?: string[] }).image_urls ?? []).slice(0, 4);
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-3 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{buyer?.full_name || "ক্রেতা"}</span>
                      <span className="text-sm font-bold text-moq" aria-label={`${r.rating} স্টার`}>
                        {"★".repeat(r.rating)}
                        <span className="text-border">{"★".repeat(5 - r.rating)}</span>
                      </span>
                    </div>
                    {r.comment && <p className="text-sm leading-relaxed">{r.comment}</p>}
                    {images.length > 0 && (
                      <div className="flex gap-2">
                        {images.map((src) => (
                          <span key={src} className="relative h-16 w-16 overflow-hidden rounded-lg bg-surface">
                            <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight">একই ধরনের পণ্য</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
