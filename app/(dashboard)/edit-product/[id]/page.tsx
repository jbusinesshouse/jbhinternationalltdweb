import { ProductUploadForm } from "@/components/products/ProductUploadForm";
import { getAuthSession } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await getAuthSession();
  if (!profile) return null;
  return <ProductUploadForm sellerId={profile.id} productId={id} />;
}
