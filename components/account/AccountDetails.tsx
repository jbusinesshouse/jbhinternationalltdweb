"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import {
  createDeliveryAddress,
  deleteDeliveryAddress,
  DeliveryAddress,
  listDeliveryAddresses,
  setDefaultDeliveryAddress,
} from "@/lib/deliveryAddresses";
import { supabase } from "@/lib/supabase/browser";

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
  const isSeller = profile.store_type === "wholesale";

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "other">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const addr = await listDeliveryAddresses(profile.id);
    setAddresses(addr);

    if (isSeller) {
      const { data } = await supabase
        .from("products")
        .select(
          `id, name, price, moq, status, product_images (image_url, is_main)`
        )
        .eq("seller_id", profile.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      setProducts((data as SellerProduct[]) ?? []);
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
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").update({ is_deleted: true }).eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddAddress = async () => {
    const district = prompt("District:");
    const upazila = prompt("Upazila:");
    const address = prompt("Address:");
    if (!district || !address) return;
    await createDeliveryAddress(profile.id, { district, upazila, address });
    load();
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    await deleteDeliveryAddress(id, profile.id);
    load();
  };

  const handleSetDefault = async (id: string | null) => {
    await setDefaultDeliveryAddress(profile.id, id);
    router.refresh();
  };

  if (loading) {
    return <p className="text-muted">Loading account...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Store", profile.store_name],
            ["Full Name", profile.full_name],
            ["Phone", profile.phone],
            ["Email", profile.email],
            ["District", profile.district],
            ["Upazila", profile.upazila],
            ["Address", profile.address],
            ["Type", profile.store_type],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium capitalize">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Delivery Addresses</h2>
          <Button size="sm" onClick={handleAddAddress}>
            Add Address
          </Button>
        </div>
        {addresses.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No saved addresses. Your store address is used by default.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">
                    {addr.label || "Saved address"}
                  </p>
                  <p className="text-sm text-muted">
                    {[addr.address, addr.upazila, addr.district]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    {profile.default_delivery_address_id === addr.id
                      ? "Default"
                      : "Set default"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => handleSetDefault(null)}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Use store address as default
        </button>
      </Card>

      {isSeller && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">My Products</h2>
            <Button href="/product-upload" size="sm">
              Upload Product
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "active", "other"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <div className="mt-4 space-y-3">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted">No products found.</p>
            ) : (
              filteredProducts.map((product) => {
                const img = product.product_images?.find((i) => i.is_main);
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
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
                        BDT {product.price} · MOQ {product.moq} ·{" "}
                        {product.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/edit-product/${product.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
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
