import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getAuthSession } from "@/lib/auth";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false },
};

export default async function AccountPage() {
  const { user, profile } = await getAuthSession();

  if (!user) {
    redirect("/sign-in");
  }

  const displayName =
    profile?.store_name || profile?.full_name || user.email || "Account";

  return (
    <div className="bg-surface min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">My Account</h1>

        <div className="mt-8 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-primary/10">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-bold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-sm text-muted">{user.email}</p>
              {profile?.store_type && (
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase text-primary">
                  {profile.store_type}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Button href="/products">Browse Products</Button>
            <Button href="/download" variant="outline">
              Open Mobile App
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted">
            For full order management, messaging, and seller tools, use the{" "}
            {BRAND.name} mobile app.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/products" className="text-primary hover:underline">
            Continue browsing products
          </Link>
        </p>
      </div>
    </div>
  );
}
