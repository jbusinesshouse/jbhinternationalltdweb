import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${BRAND.name} account to place orders and manage your business.`,
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <div className="bg-surface flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to place orders, message sellers, and more.
        </p>
        <div className="mt-6">
          <SignInForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          You can browse products without signing in.
        </p>
      </div>
    </div>
  );
}
