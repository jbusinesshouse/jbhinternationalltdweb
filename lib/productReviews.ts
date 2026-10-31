import { apiRequest, apiUpload } from "@/lib/api";

export const MAX_REVIEW_IMAGES = 4;

export type ReviewEligibility = {
  canReview: boolean;
  alreadyReviewed: boolean;
  productId: string | null;
  sellerId: string | null;
  productName: string | null;
  reason?: string;
};

export async function getReviewEligibility(orderId: string): Promise<ReviewEligibility> {
  return apiRequest<ReviewEligibility>(`/reviews/eligibility/${orderId}`, { auth: true });
}

async function uploadReviewImage(file: File, orderId: string): Promise<string> {
  const form = new FormData();
  form.append("files", file, file.name || `review_${Date.now()}.jpg`);
  form.append("orderId", orderId);
  const res = await apiUpload<{ images: { path: string; publicUrl: string }[] }>(
    "/uploads/review-images",
    form
  );
  const first = res.images?.[0];
  if (!first?.publicUrl) throw new Error("ছবি আপলোড করা যায়নি");
  return first.publicUrl;
}

export async function submitProductReview(input: {
  orderId: string;
  rating: number;
  comment: string | null;
  images: File[];
}): Promise<void> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("রেটিং ১ থেকে ৫-এর মধ্যে হতে হবে");
  }
  if (input.images.length > MAX_REVIEW_IMAGES) {
    throw new Error(`সর্বোচ্চ ${MAX_REVIEW_IMAGES}টি ছবি দেওয়া যাবে`);
  }
  const imageUrls: string[] = [];
  for (const file of input.images) {
    imageUrls.push(await uploadReviewImage(file, input.orderId));
  }
  await apiRequest("/reviews", {
    method: "POST",
    auth: true,
    body: {
      orderId: input.orderId,
      rating: input.rating,
      comment: input.comment,
      imageUrls,
    },
  });
}
