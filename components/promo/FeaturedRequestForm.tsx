"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import {
  fetchMyLatestFeaturedRequest,
  isSellerCurrentlyFeatured,
  submitFeaturedStoreRequest,
} from "@/lib/featuredStoreRequests";

export function FeaturedRequestForm({ sellerId }: { sellerId: string }) {
  const [message, setMessage] = useState("");
  const [latest, setLatest] = useState<any>(null);
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyLatestFeaturedRequest(sellerId).then(setLatest);
    isSellerCurrentlyFeatured(sellerId).then(setFeatured);
  }, [sellerId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFeaturedStoreRequest(sellerId, message || null);
      alert("ফিচার্ড স্টোরের আবেদন পাঠানো হয়েছে!");
      setLatest(await fetchMyLatestFeaturedRequest(sellerId));
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (featured) {
    return (
      <Card>
        <p className="font-extrabold text-teal">আপনার স্টোর এখন ফিচার্ড আছে!</p>
      </Card>
    );
  }

  if (latest?.status === "pending") {
    return (
      <Card>
        <StatusBadge status="pending" />
        <p className="mt-3">আপনার আবেদনটি যাচাইয়ের অপেক্ষায় আছে।</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="ফিচার্ড স্টোর"
        description="হোম পেজে আপনার স্টোর দেখান — ১০ দিন / ১,০০০ টাকা"
      />
      <Card>
        <p className="text-sm text-muted">
          ফিচার্ড স্টোর হোম পেজের তালিকায় দেখানো হয়। পেমেন্টের পর অ্যাডমিনের অনুমোদন লাগে।
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="অ্যাডমিনের জন্য বার্তা (ঐচ্ছিক)..."
            aria-label="অ্যাডমিনের জন্য বার্তা"
            rows={4}
            className="w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
          />
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "পাঠানো হচ্ছে..." : "আবেদন পাঠান"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
