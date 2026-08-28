import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getAuthSession } from "@/lib/auth";

export default async function CheckoutPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  return (
    <Suspense fallback={<p>Loading checkout...</p>}>
      <CheckoutForm profile={profile} />
    </Suspense>
  );
}
