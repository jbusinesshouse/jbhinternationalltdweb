import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { fetchStoreProducts, fetchStoreProfile } from "@/lib/products";

type StorePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await fetchStoreProfile(id);
  if (!store) return { title: "Store Not Found" };

  return {
    title: store.store_name ?? "Store",
    description: `Browse products from ${store.store_name ?? "this store"} on JBH International.`,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const [store, products] = await Promise.all([
    fetchStoreProfile(id),
    fetchStoreProducts(id),
  ]);

  if (!store) notFound();

  return (
    <div className="bg-surface min-h-screen">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-surface">
              {store.avatar_url ? (
                <Image
                  src={store.avatar_url}
                  alt={store.store_name ?? "Store"}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-bold text-primary">
                  {(store.store_name ?? "S").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {store.store_name}
              </h1>
              {store.district && (
                <p className="mt-1 text-muted">{store.district}, Bangladesh</p>
              )}
              {store.store_type && (
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                  {store.store_type}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-bold text-foreground">
          Store Products
        </h2>
        <ProductGrid
          products={products}
          emptyMessage="This store has no active products."
        />
      </div>
    </div>
  );
}
