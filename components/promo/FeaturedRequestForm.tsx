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
      alert("Featured store request submitted!");
      setLatest(await fetchMyLatestFeaturedRequest(sellerId));
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (featured) {
    return (
      <Card>
        <p className="font-semibold text-green-600">
          Your store is currently featured!
        </p>
      </Card>
    );
  }

  if (latest?.status === "pending") {
    return (
      <Card>
        <StatusBadge status="pending" />
        <p className="mt-3">Your request is pending review.</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Store Promotion"
        description="Get featured on the homepage — 10 days / 1000 BDT"
      />
      <Card>
        <p className="text-sm text-muted">
          Featured stores appear on the homepage carousel. Admin approval
          required after payment.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message to admin..."
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
