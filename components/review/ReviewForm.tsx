"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { errorBoxClass, inputClass } from "@/components/ui/form";
import { Card, PageHeader } from "@/components/ui/PageElements";
import {
  MAX_REVIEW_IMAGES,
  getReviewEligibility,
  submitProductReview,
  type ReviewEligibility,
} from "@/lib/productReviews";

const RATING_LABEL: Record<number, string> = {
  5: "চমৎকার",
  4: "ভালো",
  3: "মোটামুটি",
  2: "খারাপ",
  1: "খুব খারাপ",
};

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
      setError(err instanceof Error ? err.message : "রিভিউ পাঠানো যায়নি। আবার চেষ্টা করুন।");
      setSubmitting(false);
    }
  };

  if (checking) return <p className="text-muted">লোড হচ্ছে...</p>;

  if (!eligibility?.canReview) {
    return (
      <div>
        <PageHeader title="রিভিউ দিন" />
        <Card>
          <p className="text-muted">
            {eligibility?.alreadyReviewed
              ? "আপনি এই অর্ডারের রিভিউ আগেই দিয়েছেন। ধন্যবাদ!"
              : (eligibility?.reason ?? "এই অর্ডারে এখনো রিভিউ দেওয়া যাবে না।")}
          </p>
          <div className="mt-4">
            <Button href={`/orders/${orderId}`} variant="outline" size="sm">
              অর্ডারে ফিরুন
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="রিভিউ দিন" description={eligibility.productName ?? undefined} />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <p role="alert" className={errorBoxClass}>
              {error}
            </p>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-bold">আপনার রেটিং</legend>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={rating === n}
                  onClick={() => setRating(n)}
                  className={`flex h-11 items-center gap-2 rounded-xl border-2 px-4 text-sm font-bold transition-colors ${
                    rating === n ? "border-primary bg-primary-soft" : "border-border bg-white hover:border-primary/60"
                  }`}
                >
                  <span aria-hidden="true" className="text-moq">★</span>
                  {n.toLocaleString("bn-BD")} · {RATING_LABEL[n]}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-bold">
              আপনার মতামত (ঐচ্ছিক)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="পণ্যের মান, সাইজ, ডেলিভারি কেমন ছিল?"
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="review-photos" className="mb-1.5 block text-sm font-bold">
              ছবি (ঐচ্ছিক, সর্বোচ্চ {MAX_REVIEW_IMAGES.toLocaleString("bn-BD")}টি)
            </label>
            <input
              id="review-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files ?? []).slice(0, MAX_REVIEW_IMAGES))}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-surface file:px-4 file:py-2.5 file:font-bold hover:file:bg-border"
            />
            {images.length > 0 && (
              <p className="mt-1 text-xs text-muted">{images.length.toLocaleString("bn-BD")}টি ছবি বাছাই করা হয়েছে</p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "পাঠানো হচ্ছে..." : "রিভিউ পাঠান"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
