import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create Account",
  description: `Join ${BRAND.name} — Bangladesh's B2B clothing marketplace for wholesalers and retailers.`,
};

export default function SignUpPage() {
  return (
    <div className="bg-surface flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        <p className="mt-2 text-sm text-muted">
          Join {BRAND.name} as a buyer or seller.
        </p>
        <div className="mt-6">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
