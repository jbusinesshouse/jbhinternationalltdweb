"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

type AuthNavProps = {
  initialUser: User | null;
  initialProfile: UserProfile | null;
  compact?: boolean;
  onNavigate?: () => void;
};

export function AuthNav({
  initialUser,
  initialProfile,
  compact = false,
  onNavigate,
}: AuthNavProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setUser(initialUser);
    setProfile(initialProfile);
  }, [initialUser, initialProfile]);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, store_name, avatar_url, store_type")
          .eq("id", nextUser.id)
          .single();
        setProfile((data as UserProfile | null) ?? null);
      } else {
        setProfile(null);
      }

      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    onNavigate?.();
    router.refresh();
    router.push("/");
    setSigningOut(false);
  };

  if (!user) {
    return (
      <Link
        href="/sign-in"
        onClick={onNavigate}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:px-4"
      >
        Sign In
      </Link>
    );
  }

  const displayName =
    profile?.store_name ||
    profile?.full_name ||
    user.email?.split("@")[0] ||
    "Account";

  if (compact) {
    return (
      <Link
        href="/profile"
        onClick={onNavigate}
        className="flex shrink-0 items-center rounded-lg p-1 transition-colors hover:bg-white/10"
        aria-label={`Profile — ${displayName}`}
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-primary/20">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10"
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/20">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-white xl:block">
          {displayName}
        </span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {signingOut ? "…" : "Sign Out"}
      </button>
    </div>
  );
}
