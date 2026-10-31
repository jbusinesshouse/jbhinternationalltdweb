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
    if (!selected.length) return alert("কমপক্ষে একটি পণ্য বাছাই করুন");
    setSubmitting(true);
    try {
      const p = AD_PACKAGES[pkg];
      await submitProductAdRequest({
        sellerId,
        productIds: selected,
        sellTargetBdt: p.sellTargetBdt,
        budgetBdt: p.budgetBdt,
      });
      alert("বিজ্ঞাপনের আবেদন পাঠানো হয়েছে!");
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
        <p className="mt-3">আপনার বিজ্ঞাপনের আবেদনটি যাচাইয়ের অপেক্ষায় আছে।</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="পণ্যের বিজ্ঞাপন"
        description="হোম পেজে আপনার পণ্য স্পন্সরড হিসেবে দেখান (১০ দিন)"
      />
      <Card>
        <h3 className="font-extrabold">প্যাকেজ বাছাই করুন</h3>
        <div className="mt-3 flex flex-col gap-2">
          {AD_PACKAGES.map((p, i) => (
            <label
              key={p.budgetBdt}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 text-[15px] font-semibold transition-colors ${
                pkg === i ? "border-primary bg-primary-soft" : "border-border hover:border-primary/60"
              }`}
            >
              <input
                type="radio"
                name="ad-package"
                className="h-4 w-4 accent-[#F5832B]"
                checked={pkg === i}
                onChange={() => setPkg(i)}
              />
              {p.label}
            </label>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <h3 className="mt-6 font-extrabold">পণ্য বাছাই করুন</h3>
          <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
            {products.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-3 hover:border-primary"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#F5832B]"
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
          <Button type="submit" size="lg" className="mt-6" disabled={submitting}>
            {submitting ? "পাঠানো হচ্ছে..." : "আবেদন পাঠান"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
