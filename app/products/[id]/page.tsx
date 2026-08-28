import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductOrderActions } from "@/components/products/ProductOrderActions";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getAuthSession } from "@/lib/auth";
import { fetchProductById, fetchProductFeed } from "@/lib/products";
import { BRAND } from "@/lib/constants";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);
  if (!product) return { title: "Product Not Found" };

  const mainImage = product.product_images.find((img) => img.is_main);

  return {
    title: product.name,
    description: `Buy ${product.name} wholesale. MOQ ${product.moq}. Price: BDT ${product.price}.`,
    openGraph: {
      title: product.name,
      description: `Wholesale price BDT ${product.price} | MOQ ${product.moq}`,
      images: mainImage ? [{ url: mainImage.image_url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, { user }] = await Promise.all([
    fetchProductById(id),
    getAuthSession(),
  ]);
  if (!product) notFound();

  const images = [...product.product_images].sort(
    (a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)
  );

  const relatedProducts = product.category_id
    ? await fetchProductFeed({
        categoryId: product.category_id,
        limit: 6,
      }).then((items) => items.filter((p) => p.id !== product.id).slice(0, 5))
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, "") ?? product.name,
    image: images.map((img) => img.image_url),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
    },
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
  };

  return (
    <div className="bg-surface min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/products" className="hover:text-primary">
            Products
          </Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/products?category=${product.category_id}`}
                className="hover:text-primary"
              >
                {product.categories.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <ProductImageGallery images={images} productName={product.name} />

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-4 text-3xl font-bold text-primary">
              BDT {product.price}
            </p>
            <p className="mt-1 text-sm text-muted">
              Minimum Order Quantity: {product.moq}
            </p>

            {product.seller && (
              <Link
                href={`/store/${product.seller.id}`}
                className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-white p-4 transition-colors hover:border-primary"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface">
                  {product.seller.avatar_url ? (
                    <Image
                      src={product.seller.avatar_url}
                      alt={product.seller.store_name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-primary">
                      {product.seller.store_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted">Sold by</p>
                  <p className="font-semibold text-foreground">
                    {product.seller.store_name}
                  </p>
                </div>
              </Link>
            )}

            <ProductOrderActions
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                moq: product.moq,
                seller_id: product.seller_id,
                product_images: product.product_images,
              }}
              userId={user?.id ?? null}
            />

            {product.description && (
              <div className="mt-8 rounded-xl border border-border bg-white p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Description
                </h2>
                <div
                  className="prose prose-sm mt-4 max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-foreground">
              Related Products
            </h2>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </div>
  );
}
