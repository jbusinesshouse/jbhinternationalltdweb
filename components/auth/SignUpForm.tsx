"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState<"wholesale" | "retail">("retail");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    if (!fullName || !email || !password || !storeName) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        full_name: fullName,
        email,
        phone: phone || null,
        store_name: storeName,
        store_type: storeType,
        status: "active",
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    window.location.href = "/products";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Store Name *</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Password *</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Account Type *</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="storeType"
              value="retail"
              checked={storeType === "retail"}
              onChange={() => setStoreType("retail")}
            />
            <span className="text-sm">Retail (Buyer)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="storeType"
              value="wholesale"
              checked={storeType === "wholesale"}
              onChange={() => setStoreType("wholesale")}
            />
            <span className="text-sm">Wholesale (Seller)</span>
          </label>
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1"
        />
        <span>
          I agree to the{" "}
          <a
            href={LINKS.termsAndConditions}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a
            href={LINKS.privacyPolicy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
        </span>
      </label>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
