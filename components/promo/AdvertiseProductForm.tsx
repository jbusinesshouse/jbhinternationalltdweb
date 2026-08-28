"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import {
  AD_PACKAGES,
  fetchMyLatestProductAdRequest,
  fetchSellerProductsForAds,
  submitProductAdRequest,
} from "@/lib/productAdRequests";

export function AdvertiseProductForm({ sellerId }: { sellerId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [pkg, setPkg] = useState(0);
  const [latest, setLatest] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSellerProductsForAds(sellerId).then(setProducts);
    fetchMyLatestProductAdRequest(sellerId).then(setLatest);
  }, [sellerId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected.length) return alert("Select at least one product");
    setSubmitting(true);
    try {
      const p = AD_PACKAGES[pkg];
      await submitProductAdRequest({
        sellerId,
        productIds: selected,
        sellTargetBdt: p.sellTargetBdt,
        budgetBdt: p.budgetBdt,
      });
      alert("Advertising request submitted!");
      setLatest(await fetchMyLatestProductAdRequest(sellerId));
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (latest?.status === "pending") {
    return (
      <Card>
        <StatusBadge status="pending" />
        <p className="mt-3">Your advertising request is pending review.</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Advertise Product"
        description="Promote your products on the homepage (10 days)"
      />
      <Card>
        <h3 className="font-semibold">Select Package</h3>
        <div className="mt-3 space-y-2">
          {AD_PACKAGES.map((p, i) => (
            <label key={p.budgetBdt} className="flex items-center gap-2">
              <input
                type="radio"
                checked={pkg === i}
                onChange={() => setPkg(i)}
              />
              {p.label}
            </label>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <h3 className="mt-6 font-semibold">Select Products</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {products.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-border p-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, p.id]
                        : prev.filter((id) => id !== p.id)
                    )
                  }
                />
                <span className="text-sm">{p.name}</span>
              </label>
            ))}
          </div>
          <Button type="submit" className="mt-6" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
