"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";

export function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: order } = await supabase
      .from("orders")
      .select("product_id")
      .eq("id", orderId)
      .single();

    const { error } = await supabase.from("product_reviews").insert({
      order_id: orderId,
      product_id: order?.product_id,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      alert(error.message);
      return;
    }
    alert("Review submitted!");
    router.push(`/orders/${orderId}`);
  };

  return (
    <div>
      <PageHeader title="Leave a Review" />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
