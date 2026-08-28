import Link from "next/link";
import { ReactNode } from "react";
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
    label: "Advertise Product",
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

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

type DashboardShellProps = {
  children: ReactNode;
  profile: UserProfile;
};

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const isSeller = profile.store_type === "wholesale";
  const isActive = profile.status === "active";

  const visibleNav = navItems.filter((item) => {
    if (item.roles && profile.store_type && !item.roles.includes(profile.store_type)) {
      return false;
    }
    if (item.sellerOnly && !isActive) return false;
    return true;
  });

  return (
    <div className="bg-surface min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-4 border-b border-border pb-4">
              <p className="truncate font-semibold text-foreground">
                {profile.store_name || profile.full_name}
              </p>
              <p className="truncate text-xs text-muted">{profile.email}</p>
              {profile.store_type && (
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  {profile.store_type}
                </span>
              )}
            </div>

            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-border pt-4 space-y-1">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-1.5 text-xs text-muted hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {profile.status && profile.status !== "active" && (
            <div
              className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
                profile.status === "freeze"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Your account is {profile.status}. Some actions may be limited.
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
