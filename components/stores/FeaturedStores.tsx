import Image from "next/image";
import Link from "next/link";
import { FeaturedStore } from "@/lib/featuredStores";

type FeaturedStoresProps = {
  stores: FeaturedStore[];
};

export function FeaturedStores({ stores }: FeaturedStoresProps) {
  if (!stores.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Featured Stores</h2>
      </div>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/store/${store.id}`}
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-surface transition-colors group-hover:border-primary">
              {store.avatar_url ? (
                <Image
                  src={store.avatar_url}
                  alt={store.store_name ?? "Store"}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                  {(store.store_name ?? "S").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="line-clamp-2 text-center text-xs font-medium text-foreground group-hover:text-primary">
              {store.store_name ?? "Store"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
