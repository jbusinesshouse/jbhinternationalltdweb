import { redirect } from "next/navigation";
import { ProductUploadForm } from "@/components/products/ProductUploadForm";
import { getAuthSession } from "@/lib/auth";

export default async function ProductUploadPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  if (profile.store_type !== "wholesale") redirect("/profile");
  if (profile.status !== "active") redirect("/profile");
  return <ProductUploadForm sellerId={profile.id} />;
}
