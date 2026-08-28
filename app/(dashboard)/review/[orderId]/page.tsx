import { ReviewForm } from "@/components/review/ReviewForm";

type Props = { params: Promise<{ orderId: string }> };

export default async function ReviewPage({ params }: Props) {
  const { orderId } = await params;
  return <ReviewForm orderId={orderId} />;
}
