"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { authErrorMessage, errorBoxClass, inputClass, labelClass } from "@/components/ui/form";
import { safeNextPath } from "@/lib/safeRedirect";
import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "সাইন ইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।" : null
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("ইমেইল ও পাসওয়ার্ড দিন।");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(authErrorMessage(signInError.message));
      setLoading(false);
      return;
    }

    // Full page navigation so the server picks up the new session cookies.
    window.location.href = nextPath;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div role="alert" className={errorBoxClass}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className={labelClass}>ইমেইল</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>পাসওয়ার্ড</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="আপনার পাসওয়ার্ড"
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "সাইন ইন হচ্ছে..." : "সাইন ইন"}
      </Button>

      <p className="text-center text-sm text-muted">
        অ্যাকাউন্ট নেই?{" "}
        <Link href="/sign-up" className="font-bold text-primary-strong hover:underline">
          নতুন অ্যাকাউন্ট খুলুন
        </Link>
      </p>
    </form>
  );
}
