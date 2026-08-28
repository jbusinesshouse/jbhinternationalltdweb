"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import {
  toOrderDeliverySnapshot,
} from "@/lib/deliveryAddresses";
import { supabase } from "@/lib/supabase/browser";

export function CheckoutForm({ profile }: { profile: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");

  const parsed = useMemo(() => {
    if (!dataParam) return null;
    try {
      return JSON.parse(decodeURIComponent(dataParam));
    } catch {
      return null;
    }
  }, [dataParam]);

  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
  });
  const [addressMode, setAddressMode] = useState<"store" | "custom">("store");
  const [customAddress, setCustomAddress] = useState({
    district: profile.district ?? "",
    upazila: profile.upazila ?? "",
    address: profile.address ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!parsed) {
    return (
      <Card>
        <p>Invalid checkout data. Please start from a product page.</p>
        <Button href="/products" className="mt-4">
          Browse Products
        </Button>
      </Card>
    );
  }

  const lineItems = useMemo(() => {
    const items: any[] = [];
    const { selectedQty, variants, sizes, product } = parsed;
    for (const variant of variants ?? []) {
      for (const size of sizes?.filter((s: any) => s.variant_id === variant.id) ?? []) {
        const qty = selectedQty?.[variant.id]?.[size.id] ?? 0;
        if (qty > 0) {
          items.push({
            variant_id: variant.id,
            size_id: size.id,
            quantity: qty,
            product_name_snapshot: product.name,
            price_snapshot: Number(product.price),
          });
        }
      }
    }
    return items;
  }, [parsed]);

  const total = lineItems.reduce(
    (sum, i) => sum + i.quantity * i.price_snapshot,
    0
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lineItems.length) {
      alert("Select quantity first");
      return;
    }
    setSubmitting(true);

    const delivery =
      addressMode === "store"
        ? toOrderDeliverySnapshot({
            district: profile.district ?? "",
            upazila: profile.upazila,
            address: profile.address ?? "",
          })
        : toOrderDeliverySnapshot(customAddress);

    const { data: sellerRow } = await supabase
      .from("products")
      .select("seller_id")
      .eq("id", parsed.product.id)
      .single();

    const { data, error } = await supabase.rpc("place_order", {
      p_product_id: parsed.product.id,
      p_seller_id: sellerRow?.seller_id,
      p_full_name: form.full_name,
      p_phone: form.phone,
      p_email: form.email || null,
      p_city: delivery.city,
      p_delivery_address: delivery.delivery_address,
      p_items: lineItems,
    });

    setSubmitting(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.push(`/orders/${data?.order_id ?? data}`);
  };

  return (
    <div>
      <PageHeader title="Checkout" description="Confirm your order" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Contact</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {(["full_name", "phone", "email"] as const).map((key) => (
              <input
                key={key}
                required={key !== "email"}
                placeholder={key.replace("_", " ")}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            ))}
            <h3 className="pt-2 font-semibold">Delivery</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddressMode("store")}
                className={`rounded-lg px-3 py-1 text-sm ${
                  addressMode === "store" ? "bg-primary text-white" : "bg-surface"
                }`}
              >
                Store address
              </button>
              <button
                type="button"
                onClick={() => setAddressMode("custom")}
                className={`rounded-lg px-3 py-1 text-sm ${
                  addressMode === "custom" ? "bg-primary text-white" : "bg-surface"
                }`}
              >
                Custom
              </button>
            </div>
            {addressMode === "custom" && (
              <>
                <input
                  placeholder="District"
                  value={customAddress.district}
                  onChange={(e) =>
                    setCustomAddress((p) => ({ ...p, district: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2"
                  required
                />
                <input
                  placeholder="Upazila"
                  value={customAddress.upazila}
                  onChange={(e) =>
                    setCustomAddress((p) => ({ ...p, upazila: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2"
                />
                <input
                  placeholder="Address"
                  value={customAddress.address}
                  onChange={(e) =>
                    setCustomAddress((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2"
                  required
                />
              </>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Placing order..." : "Confirm Order"}
            </Button>
          </form>
        </Card>
        <Card>
          <h3 className="font-semibold">Order Summary</h3>
          <p className="mt-2">{parsed.product.name}</p>
          <div className="mt-4 space-y-2 text-sm">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.product_name_snapshot} × {item.quantity}
                </span>
                <span>
                  BDT {(item.price_snapshot * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xl font-bold">Total: BDT {total.toFixed(2)}</p>
        </Card>
      </div>
    </div>
  );
}
