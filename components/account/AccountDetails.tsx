"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import { DeliveryAddressSection } from "@/components/delivery/DeliveryAddressSection";
import { isProductListingAccount } from "@/lib/moqRules";
import { apiRequest } from "@/lib/api";

type SellerProduct = {
  id: string;
  name: string;
  price: string;
  moq: number | null;
  status: string | null;
  product_images?: { image_url: string; is_main: boolean }[];
};

export function AccountDetails({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const isSeller = isProductListingAccount(profile.store_type);

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "other">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    if (isSeller) {
      try {
        const res = await apiRequest<{ products: SellerProduct[] }>("/account/products", {
          auth: true,
        });
        setProducts(res.products ?? []);
      } catch {
        setProducts([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile.id, isSeller]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filter === "active") list = list.filter((p) => p.status === "active");
    if (filter === "other") list = list.filter((p) => p.status !== "active");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, filter, search]);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("এই পণ্যটি মুছে ফেলবেন?")) return;
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE", auth: true });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "পণ্যটি মোছা যায়নি।");
    }
  };

  if (loading) {
    return <p className="text-muted">অ্যাকাউন্ট লোড হচ্ছে...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-lg font-extrabold">প্রোফাইল তথ্য</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["দোকান", profile.store_name],
            ["পুরো নাম", profile.full_name],
            ["মোবাইল", profile.phone],
            ["ইমেইল", profile.email],
            ["জেলা", profile.district],
            ["উপজেলা", profile.upazila],
            ["ঠিকানা", profile.address],
            ["ধরন", profile.store_type === "wholesale" ? "পাইকারি" : profile.store_type === "retail" ? "খুচরা" : null],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold">ডেলিভারি ঠিকানা</h2>
        <DeliveryAddressSection
          profile={profile}
          onProfileDefaultChange={() => router.refresh()}
        />
      </Card>

      {isSeller && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">আমার পণ্য</h2>
            <Button href="/product-upload" size="sm">
              নতুন পণ্য
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "active", "other"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                  filter === f
                    ? "bg-primary text-primary-ink"
                    : "bg-surface text-foreground"
                }`}
              >
                {f === "all" ? "সব" : f === "active" ? "সক্রিয়" : "অন্যান্য"}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            aria-label="পণ্য খুঁজুন"
            className="mt-3 w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
          />
          <div className="mt-4 flex flex-col gap-3">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted">কোনো পণ্য পাওয়া যায়নি।</p>
            ) : (
              filteredProducts.map((product) => {
                const img = product.product_images?.find((i) => i.is_main);
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                      {img ? (
                        <Image
                          src={img.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-sm text-muted">
                        ৳{Number(product.price).toLocaleString("bn-BD")} · MOQ {Number(product.moq ?? 0).toLocaleString("bn-BD")} ·{" "}
                        {product.status === "active" ? "সক্রিয়" : product.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/edit-product/${product.id}`}
                        className="text-sm font-bold text-primary-strong hover:underline"
                      >
                        এডিট
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-sm font-bold text-[#B42318] hover:underline"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
