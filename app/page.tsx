import { AppDownloadCTA } from "@/components/home/AppDownloadCTA";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { FeaturedStores } from "@/components/stores/FeaturedStores";
import { fetchActiveFeaturedStores } from "@/lib/featuredStores";
import { fetchProductFeed } from "@/lib/products";
import { BRAND } from "@/lib/constants";

export default async function HomePage() {
  const [products, stores] = await Promise.all([
    fetchProductFeed({ limit: 10 }),
    fetchActiveFeaturedStores(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    description: BRAND.description,
    url: process.env.NEXT_PUBLIC_SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Features />

      {stores.length > 0 && (
        <section className="border-b border-border bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FeaturedStores stores={stores} />
          </div>
        </section>
      )}

      <FeaturedProducts products={products} />
      <AppDownloadCTA />
    </>
  );
}
