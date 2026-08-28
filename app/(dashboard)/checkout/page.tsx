import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getAuthSession } from "@/lib/auth";
import { canPlaceOrders } from "@/lib/profile";

export default async function CheckoutPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;

  if (!canPlaceOrders(profile)) {
    redirect("/products");
  }

  return (
    <Suspense fallback={<p>Loading checkout...</p>}>
      <CheckoutForm profile={profile} />
    </Suspense>
  );
}
