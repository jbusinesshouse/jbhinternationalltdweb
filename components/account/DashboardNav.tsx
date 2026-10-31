"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BagIcon,
  BellIcon,
  BoxIcon,
  ChatIcon,
  DashboardIcon,
  HelpIcon,
  LinkIcon,
  MegaphoneIcon,
  PlusIcon,
  StarIcon,
  StoreIcon,
  UserIcon,
} from "@/components/ui/icons";
import type { UserProfile } from "@/lib/profile";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  /** Only these store types see it (all if omitted). */
  roles?: ("wholesale" | "retail")[];
  /** Needs an active (approved) seller account. */
  sellerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/profile", label: "প্রোফাইল", Icon: UserIcon },
  { href: "/account", label: "আমার অ্যাকাউন্ট", Icon: StoreIcon },
  { href: "/messages", label: "মেসেজ", Icon: ChatIcon },
  { href: "/notifications", label: "নোটিফিকেশন", Icon: BellIcon },
  { href: "/hub", label: "সেলার হাব", Icon: DashboardIcon },
  { href: "/orders", label: "আমার অর্ডার", Icon: BagIcon },
  { href: "/sales", label: "বিক্রি ও অর্ডার", Icon: BoxIcon, roles: ["wholesale"] },
  { href: "/product-upload", label: "নতুন পণ্য", Icon: PlusIcon, roles: ["wholesale", "retail"], sellerOnly: true },
  { href: "/advertise-product", label: "পণ্যের বিজ্ঞাপন", Icon: MegaphoneIcon, roles: ["wholesale"] },
  { href: "/featured-request", label: "ফিচার্ড স্টোর", Icon: StarIcon, roles: ["wholesale"] },
  { href: "/content-creator-referral", label: "ক্রিয়েটর রেফারেল", Icon: LinkIcon },
  { href: "/support", label: "সাহায্য", Icon: HelpIcon },
];

function visibleItems(profile: Pick<UserProfile, "store_type" | "status">) {
  const isActive = profile.status === "active";
  return NAV_ITEMS.filter((item) => {
    if (item.roles && profile.store_type && !item.roles.includes(profile.store_type)) return false;
    if (item.sellerOnly && !isActive) return false;
    return true;
  });
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar (desktop). */
export function DashboardNav({ profile }: { profile: Pick<UserProfile, "store_type" | "status"> }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="অ্যাকাউন্ট মেনু" className="flex flex-col gap-0.5">
      {visibleItems(profile).map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
              active ? "bg-primary-soft font-bold text-foreground" : "font-semibold text-foreground/80 hover:bg-surface"
            }`}
          >
            <span className={active ? "text-primary-strong" : "text-muted"}>
              <Icon size={20} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Scrollable chips (phone/tablet). The bottom tab bar covers the basics; this reaches the rest. */
export function DashboardChips({ profile }: { profile: Pick<UserProfile, "store_type" | "status"> }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="অ্যাকাউন্ট মেনু" className="scrollbar-hide -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
      {visibleItems(profile).map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm ${
              active ? "border-primary bg-primary-soft font-bold text-moq" : "border-border bg-white font-semibold text-foreground"
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
