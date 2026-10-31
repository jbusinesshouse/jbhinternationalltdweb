import Link from "next/link";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Button } from "@/components/ui/Button";
import { fetchGuestCheckoutEnabled } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Public checkout: signed-in users order directly; guests confirm with an SMS code
 * once guest checkout is enabled on the API (needs an SMS provider).
 */
export default async function PublicCheckoutPage() {
  const [{ user, profile }, guestEnabled] = await Promise.all([
    getAuthSession(),
    fetchGuestCheckoutEnabled(),
  ]);
  const formProfile = user && profile ? profile : null;

  if (!formProfile && !guestEnabled) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Sign in to place your order</h1>
        <p className="mt-3 text-muted">
          Create a free account or sign in to complete your order. Your selected items are
          kept — just come back to this page after signing in.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/sign-in" size="lg">
            Sign in
          </Button>
          <Button href="/sign-up" variant="outline" size="lg">
            Create account
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted">
          <Link href="/products" className="text-primary hover:underline">
            Continue browsing
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<p>Loading checkout...</p>}>
        <CheckoutForm profile={formProfile} />
      </Suspense>
    </div>
  );
}
