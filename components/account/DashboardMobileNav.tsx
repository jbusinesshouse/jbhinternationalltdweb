"use client";

import Link from "next/link";
import { useState } from "react";
import { UserProfile } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles?: ("wholesale" | "retail")[];
  sellerOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/account", label: "My Account", icon: "🏪" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/hub", label: "Hub", icon: "📋" },
  { href: "/orders", label: "My Orders", icon: "📦", roles: ["retail"] },
  { href: "/sales", label: "Sales Orders", icon: "💰", roles: ["wholesale"] },
  {
    href: "/product-upload",
    label: "Upload Product",
    icon: "➕",
    roles: ["wholesale"],
    sellerOnly: true,
  },
  {
    href: "/advertise-product",
    label: "Advertise",
    icon: "📣",
    roles: ["wholesale"],
  },
  {
    href: "/featured-request",
    label: "Store Promotion",
    icon: "⭐",
    roles: ["wholesale"],
  },
  {
    href: "/content-creator-referral",
    label: "Creator Referral",
    icon: "🔗",
  },
  { href: "/support", label: "Support", icon: "🆘" },
];

export function DashboardMobileNav({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false);
  const isActive = profile.status === "active";

  const visibleNav = navItems.filter((item) => {
    if (
      item.roles &&
      profile.store_type &&
      !item.roles.includes(profile.store_type)
    ) {
      return false;
    }
    if (item.sellerOnly && !isActive) return false;
    return true;
  });

  return (
    <div className="mb-6 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm"
        aria-expanded={open}
      >
        <span>Account navigation</span>
        <svg
          className={`h-5 w-5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <nav
          className="mt-2 rounded-xl border border-border bg-white p-2 shadow-sm"
          aria-label="Account navigation"
        >
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
