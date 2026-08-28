import { redirect } from "next/navigation";
import { FeaturedRequestForm } from "@/components/promo/FeaturedRequestForm";
import { getAuthSession } from "@/lib/auth";

export default async function FeaturedRequestPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  if (profile.store_type !== "wholesale") redirect("/profile");
  return <FeaturedRequestForm sellerId={profile.id} />;
}
