import { redirect } from "next/navigation";
import { AdvertiseProductForm } from "@/components/promo/AdvertiseProductForm";
import { getAuthSession } from "@/lib/auth";

export default async function AdvertiseProductPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  if (profile.store_type !== "wholesale") redirect("/profile");
  return <AdvertiseProductForm sellerId={profile.id} />;
}
