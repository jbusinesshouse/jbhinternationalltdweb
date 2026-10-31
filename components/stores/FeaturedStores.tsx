import Image from "next/image";
import Link from "next/link";
import type { FeaturedStore } from "@/lib/featuredStores";

export function FeaturedStores({ stores }: { stores: FeaturedStore[] }) {
  if (!stores.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold tracking-tight">ফিচার্ড স্টোর</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {stores.map((store) => {
          const name = store.store_name ?? "স্টোর";
          return (
            <Link
              key={store.id}
              href={`/store/${store.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-4 text-center transition-colors hover:border-primary"
            >
              <span className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-primary-soft text-xl font-bold text-primary-strong">
                {store.avatar_url ? (
                  <Image src={store.avatar_url} alt="" fill className="object-cover" sizes="64px" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="line-clamp-2 text-sm font-bold">{name}</span>
              <span className="text-xs font-semibold text-primary-strong">স্টোর দেখুন →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
