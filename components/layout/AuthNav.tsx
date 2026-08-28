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
};

export function AuthNav({ initialUser, initialProfile }: AuthNavProps) {
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
    router.refresh();
    router.push("/");
    setSigningOut(false);
  };

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="ml-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Sign In
      </Link>
    );
  }

  const displayName =
    profile?.store_name || profile?.full_name || user.email?.split("@")[0] || "Account";

  return (
    <div className="ml-1 flex items-center gap-2">
      <Link
        href="/account"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10"
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
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:block">
          {displayName}
        </span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {signingOut ? "..." : "Sign Out"}
      </button>
    </div>
  );
}
