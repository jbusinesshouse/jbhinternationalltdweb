import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Public checkout: guests use SMS OTP; signed-in users place orders without OTP.
 */
export default async function PublicCheckoutPage() {
  const { user, profile } = await getAuthSession();
  const formProfile = user && profile ? profile : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<p>Loading checkout...</p>}>
        <CheckoutForm profile={formProfile} />
      </Suspense>
    </div>
  );
}
