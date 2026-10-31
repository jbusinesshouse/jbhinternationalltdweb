import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { SellerBand } from "@/components/home/SellerBand";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductGrid } from "@/components/products/ProductGrid";
import { FeaturedStores } from "@/components/stores/FeaturedStores";
import { fetchGuestCheckoutEnabled } from "@/lib/api";
import { jsonLdString } from "@/lib/jsonLd";
import { getAuthSession } from "@/lib/auth";
import { fetchCategories } from "@/lib/categories";
import { BRAND } from "@/lib/constants";
import { fetchActiveFeaturedStores } from "@/lib/featuredStores";
import { fetchProductFeed } from "@/lib/products";

export default async function HomePage() {
  const [products, stores, categories, { user, profile }, guestCheckout] = await Promise.all([
    fetchProductFeed({ limit: 15 }),
    fetchActiveFeaturedStores(),
    fetchCategories(),
    getAuthSession(),
    fetchGuestCheckoutEnabled(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jbhinternationallimited.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    description: BRAND.description,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const isSeller = profile?.store_type === "wholesale" || profile?.store_type === "retail";
  const tab = "inline-flex h-10 items-center rounded-[9px] px-4 text-sm";

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-5 sm:px-6 sm:py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />

      <HomeHero categories={categories} showcase={products} user={user} profile={profile} />
      <TrustStrip guestCheckout={guestCheckout} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[26px]">আপনার জন্য পণ্য</h2>
            <p className="mt-1 text-muted">সব দাম ভ্যাটসহ · প্রতি পিস</p>
          </div>
          <nav aria-label="পণ্যের ধরন" className="flex gap-1 rounded-xl bg-[#E9ECF1] p-1">
            <Link href="/products" className={`${tab} bg-white font-bold shadow-sm`}>সব</Link>
            <Link href="/products?storeType=wholesale" className={`${tab} font-semibold text-foreground/80 hover:bg-white/60`}>পাইকারি</Link>
            <Link href="/products?storeType=retail" className={`${tab} font-semibold text-foreground/80 hover:bg-white/60`}>খুচরা</Link>
          </nav>
        </div>
        <ProductGrid products={products} priorityCount={5} />
        <div className="flex justify-center">
          <Link href="/products" className="inline-flex h-12 items-center rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-7 font-bold hover:border-primary">
            আরও পণ্য দেখুন
          </Link>
        </div>
      </section>

      <FeaturedStores stores={stores} />
      <SellerBand isSeller={isSeller} />
    </div>
  );
}
