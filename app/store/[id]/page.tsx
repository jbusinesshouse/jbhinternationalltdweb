import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { bnNumber, STORE_TYPE_LABEL } from "@/lib/labels";
import { fetchStoreProducts, fetchStoreProfile } from "@/lib/products";

type StorePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await fetchStoreProfile(id);
  if (!store) return { title: "স্টোর পাওয়া যায়নি" };
  return {
    title: store.store_name ?? "স্টোর",
    description: `${store.store_name ?? "এই স্টোর"}-এর সব পণ্য দেখুন JBH-এ।`,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const [store, products] = await Promise.all([fetchStoreProfile(id), fetchStoreProducts(id)]);
  if (!store) notFound();

  const name = store.store_name ?? "স্টোর";
  const location = [store.upazila, store.district].filter(Boolean).join(", ");

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6">
      <section className="flex flex-wrap items-center gap-5 rounded-[22px] border border-border bg-white p-5 sm:p-7">
        <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-2xl font-bold text-primary-strong">
          {store.avatar_url ? (
            <Image src={store.avatar_url} alt="" fill className="object-cover" sizes="80px" priority />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {store.store_type && (
              <span
                className={`rounded-full px-3 py-1 font-bold ${
                  store.store_type === "retail" ? "bg-teal-soft text-teal" : "bg-navy-soft text-navy"
                }`}
              >
                {STORE_TYPE_LABEL[store.store_type] ?? store.store_type} সেলার
              </span>
            )}
            {location && <span className="text-muted">{location}</span>}
            <span className="text-muted">· {bnNumber(products.length)}টি পণ্য</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold">স্টোরের পণ্য</h2>
        <ProductGrid products={products} priorityCount={5} emptyMessage="এই স্টোরে এখন কোনো পণ্য নেই।" />
      </section>
    </div>
  );
}
