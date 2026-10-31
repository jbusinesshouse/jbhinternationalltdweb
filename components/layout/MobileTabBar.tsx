"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, ChatIcon, GridIcon, HomeIcon, UserIcon } from "@/components/ui/icons";

const tabs = [
  { href: "/", label: "হোম", Icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/products", label: "ক্যাটাগরি", Icon: GridIcon, match: (p: string) => p.startsWith("/products") || p.startsWith("/search") },
  { href: "/messages", label: "মেসেজ", Icon: ChatIcon, match: (p: string) => p.startsWith("/messages") },
  { href: "/orders", label: "অর্ডার", Icon: BagIcon, match: (p: string) => p.startsWith("/orders") },
  { href: "/profile", label: "প্রোফাইল", Icon: UserIcon, match: (p: string) => p.startsWith("/profile") || p.startsWith("/account") },
];

/** Phone/tablet bottom navigation (hidden from lg up, where the header has everything). */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="প্রধান মেনু"
      className="fixed inset-x-0 bottom-0 z-50 grid h-[72px] grid-cols-5 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              active ? "font-bold text-primary-strong" : "font-semibold text-muted"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
