import { redirect } from "next/navigation";
import { ProductUploadForm } from "@/components/products/ProductUploadForm";
import { getAuthSession } from "@/lib/auth";
import { isProductListingAccount } from "@/lib/moqRules";

export default async function ProductUploadPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  if (!isProductListingAccount(profile.store_type)) redirect("/profile");
  if (profile.status !== "active") redirect("/profile");
  return <ProductUploadForm sellerId={profile.id} profile={profile} />;
}
