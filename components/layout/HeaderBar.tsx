"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { BagIcon, BellIcon, ChatIcon } from "@/components/ui/icons";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Category } from "@/lib/categories";
import { LINKS } from "@/lib/constants";
import type { UserProfile } from "@/lib/profile";
import { categoryLabel } from "@/lib/labels";

type HeaderBarProps = {
  user: User | null;
  profile: UserProfile | null;
  categories: Category[];
};

function HeaderAction({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="hidden min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-surface hover:text-foreground lg:flex"
    >
      {children}
      {label}
    </Link>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 text-foreground" aria-label="JBH International Limited — হোম">
      <Image src="/favicon.png" alt="" width={44} height={44} className="h-10 w-10 rounded-xl sm:h-11 sm:w-11" priority />
      <span className="hidden flex-col leading-tight sm:flex">
        <strong className="text-xl font-extrabold tracking-tight">JBH</strong>
        <span className="text-xs text-muted">International Limited</span>
      </span>
    </Link>
  );
}

export function HeaderBar({ user, profile, categories }: HeaderBarProps) {
  const pathname = usePathname();
  const onProducts = pathname === "/products";

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors ${
      active
        ? "bg-primary-soft font-bold text-moq"
        : "font-semibold text-foreground/80 hover:bg-surface hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="hidden bg-navy text-[13px] text-[#DCE3F0] md:block">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-6 py-2">
          <span>বাংলাদেশের পাইকারি পোশাকের অনলাইন মার্কেট</span>
          <nav aria-label="সহায়ক লিংক" className="flex items-center gap-5">
            <Link href="/sign-up" className="hover:text-white">সেলার হোন</Link>
            <a href={LINKS.playStore} target="_blank" rel="noopener noreferrer" className="hover:text-white">অ্যাপ ডাউনলোড</a>
            <Link href="/support" className="hover:text-white">সাহায্য</Link>
          </nav>
        </div>
      </div>

      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <Logo />
          <div className="hidden min-w-0 flex-1 md:block">
            <Suspense fallback={<div className="h-[50px] rounded-2xl border-2 border-primary" />}>
              <SearchBar size="lg" />
            </Suspense>
          </div>
          <nav aria-label="অ্যাকাউন্ট" className="ml-auto flex items-center gap-1 md:ml-0">
            {user && (
              <>
                <HeaderAction href="/messages" label="মেসেজ"><ChatIcon /></HeaderAction>
                <HeaderAction href="/orders" label="অর্ডার"><BagIcon /></HeaderAction>
                <Link
                  href="/notifications"
                  aria-label="নোটিফিকেশন"
                  className="grid h-11 w-11 place-items-center rounded-xl text-foreground/80 hover:bg-surface hover:text-foreground"
                >
                  <BellIcon />
                </Link>
              </>
            )}
            <AccountMenu user={user} profile={profile} />
          </nav>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <Suspense fallback={<div className="h-12 rounded-2xl border-2 border-primary" />}>
            <SearchBar placeholder="জার্সি, পোলো, জিন্স..." />
          </Suspense>
        </div>

        <nav
          aria-label="ক্যাটাগরি"
          className="scrollbar-hide mx-auto flex max-w-[1320px] gap-1.5 overflow-x-auto px-4 pb-3 sm:px-6"
        >
          <Link href="/products" className={chip(onProducts)}>সব পণ্য</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.id}`} className={chip(false)}>
              {categoryLabel(c.name)}
            </Link>
          ))}
          <Link href="/products?storeType=wholesale" className={chip(false)}>পাইকারি</Link>
          <Link href="/products?storeType=retail" className={chip(false)}>খুচরা</Link>
        </nav>
      </div>
    </header>
  );
}
