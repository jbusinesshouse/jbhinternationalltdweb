"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BagIcon,
  BellIcon,
  BoxIcon,
  ChatIcon,
  DashboardIcon,
  LogoutIcon,
  PlusIcon,
  UserIcon,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/profile";

type AccountMenuProps = {
  user: User | null;
  profile: UserProfile | null;
};

export function Avatar({
  profile,
  name,
  size = 36,
}: {
  profile: UserProfile | null;
  name: string;
  size?: number;
}) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-bold text-primary-strong"
      style={{ width: size, height: size }}
    >
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes={`${size}px`} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export function displayNameFor(user: User, profile: UserProfile | null) {
  return profile?.store_name || profile?.full_name || user.email?.split("@")[0] || "অ্যাকাউন্ট";
}

export function AccountMenu({ user, profile }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Header is server-rendered: refresh it when the session changes in this tab.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-up"
          className="hidden h-11 items-center rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-surface xl:inline-flex"
        >
          অ্যাকাউন্ট খুলুন
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-navy-dark sm:h-11"
        >
          সাইন ইন
        </Link>
      </div>
    );
  }

  const name = displayNameFor(user, profile);
  const isSeller = profile?.store_type === "wholesale" || profile?.store_type === "retail";
  const isWholesale = profile?.store_type === "wholesale";

  const signOut = async () => {
    setSigningOut(true);
    await createClient().auth.signOut();
    setOpen(false);
    setSigningOut(false);
    router.push("/");
    router.refresh();
  };

  const item =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-surface";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`অ্যাকাউন্ট মেনু — ${name}`}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface"
      >
        <Avatar profile={profile} name={name} />
        <span className="hidden max-w-[130px] truncate text-sm font-semibold xl:block">{name}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[70] mt-2 w-64 rounded-2xl border border-border bg-white p-2 shadow-[0_16px_40px_rgba(18,33,63,0.14)]"
        >
          <div className="flex items-center gap-3 border-b border-border px-3 pb-3 pt-2">
            <Avatar profile={profile} name={name} size={40} />
            <div className="min-w-0">
              <p className="truncate font-bold">{name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col py-2" onClick={() => setOpen(false)}>
            <Link role="menuitem" href="/profile" className={item}><UserIcon size={18} />প্রোফাইল</Link>
            <Link role="menuitem" href="/orders" className={item}><BagIcon size={18} />আমার অর্ডার</Link>
            <Link role="menuitem" href="/messages" className={item}><ChatIcon size={18} />মেসেজ</Link>
            <Link role="menuitem" href="/notifications" className={item}><BellIcon size={18} />নোটিফিকেশন</Link>
            {isSeller && (
              <>
                <div className="my-1 h-px bg-border" />
                <Link role="menuitem" href="/hub" className={item}><DashboardIcon size={18} />সেলার হাব</Link>
                {isWholesale && (
                  <Link role="menuitem" href="/sales" className={item}><BoxIcon size={18} />বিক্রি ও অর্ডার</Link>
                )}
                <Link role="menuitem" href="/product-upload" className={item}><PlusIcon size={18} />নতুন পণ্য</Link>
              </>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl border-t border-border px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <LogoutIcon size={18} />
            {signingOut ? "সাইন আউট হচ্ছে..." : "সাইন আউট"}
          </button>
        </div>
      )}
    </div>
  );
}
