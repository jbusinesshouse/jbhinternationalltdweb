"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import {
  MAX_REVIEW_IMAGES,
  getReviewEligibility,
  submitProductReview,
  type ReviewEligibility,
} from "@/lib/productReviews";

export function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [checking, setChecking] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReviewEligibility(orderId)
      .then(setEligibility)
      .catch(() => setEligibility(null))
      .finally(() => setChecking(false));
  }, [orderId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitProductReview({
        orderId,
        rating,
        comment: comment.trim() || null,
        images,
      });
      router.push(`/orders/${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review.");
      setSubmitting(false);
    }
  };

  if (checking) return <p className="text-muted">Loading...</p>;

  if (!eligibility?.canReview) {
    return (
      <div>
        <PageHeader title="Leave a Review" />
        <Card>
          <p className="text-muted">
            {eligibility?.alreadyReviewed
              ? "You have already reviewed this order. Thank you!"
              : (eligibility?.reason ?? "This order can’t be reviewed yet.")}
          </p>
          <div className="mt-4">
            <Button href={`/orders/${orderId}`} variant="outline" size="sm">
              Back to order
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Leave a Review"
        description={eligibility.productName ?? undefined}
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div>
            <label className="text-sm font-medium">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your review (optional)"
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <div>
            <label className="text-sm font-medium">
              Photos (optional, up to {MAX_REVIEW_IMAGES})
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setImages(Array.from(e.target.files ?? []).slice(0, MAX_REVIEW_IMAGES))
              }
              className="mt-1 block w-full text-sm"
            />
            {images.length > 0 && (
              <p className="mt-1 text-xs text-muted">{images.length} photo(s) selected</p>
            )}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
