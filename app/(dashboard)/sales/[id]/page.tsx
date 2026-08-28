import { SalesDetail } from "@/components/sales/SalesDetail";

type Props = { params: Promise<{ id: string }> };

export default async function SalesDetailPage({ params }: Props) {
  const { id } = await params;
  return <SalesDetail orderId={id} />;
}
