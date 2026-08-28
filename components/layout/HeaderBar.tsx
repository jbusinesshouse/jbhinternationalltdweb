"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthNav } from "@/components/layout/AuthNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { UserProfile } from "@/lib/auth";
import { BRAND } from "@/lib/constants";

const publicNavLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/download", label: "Get App" },
];

const authNavLinks = [
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
  { href: "/account", label: "My Account" },
  { href: "/hub", label: "Hub" },
];

type HeaderBarProps = {
  user: User | null;
  profile: UserProfile | null;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export function HeaderBar({ user, profile }: HeaderBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-black">
      <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/" className="shrink-0 min-w-0" onClick={closeMenu}>
            <span className="relative text-base font-bold text-white sm:text-lg lg:text-xl">
              {BRAND.shortName}
              <span className="hidden min-[400px]:inline"> International</span>
              <span className="absolute text-[8px] font-semibold uppercase leading-none tracking-wide text-gray-400 sm:text-[9px]" style={{ bottom: "-9px", right: "-5px" }}>
                LTD
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block lg:max-w-lg xl:max-w-xl">
            <SearchBar placeholder="Search wholesale products..." size="sm" />
          </div>

          {/* Desktop navigation */}
          <nav
            className="hidden min-w-0 items-center gap-0.5 lg:flex lg:ml-auto"
            aria-label="Main"
          >
            {user && (
              <>
                <Link
                  href="/messages"
                  className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white xl:px-3"
                >
                  Messages
                </Link>
                <Link
                  href="/notifications"
                  className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white xl:px-3"
                >
                  Alerts
                </Link>
              </>
            )}
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white xl:px-3"
              >
                {link.label}
              </Link>
            ))}
            <AuthNav initialUser={user} initialProfile={profile} />
          </nav>

          {/* Mobile actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
            {user && (
              <Link
                href="/notifications"
                className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <BellIcon />
              </Link>
            )}
            <AuthNav
              initialUser={user}
              initialProfile={profile}
              compact
              onNavigate={closeMenu}
            />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-white/10 px-3 pb-3 lg:hidden sm:px-6">
        <SearchBar placeholder="Search products..." size="sm" />
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
            aria-label="Close menu"
          />
          <nav
            id="mobile-nav-panel"
            className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col bg-black shadow-2xl sm:max-w-sm"
            aria-label="Mobile"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="font-semibold text-white">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-lg p-2 text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <MenuIcon open />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3">
              {user && (
                <div className="mb-3 space-y-0.5 border-b border-white/10 pb-3">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account
                  </p>
                  {authNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className="block rounded-lg px-3 py-3 text-base font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Explore
              </p>
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}

              {!user && (
                <Link
                  href="/sign-up"
                  onClick={closeMenu}
                  className="mt-3 block rounded-lg px-3 py-3 text-base font-medium text-primary"
                >
                  Create Account
                </Link>
              )}
            </div>

            {user && (
              <div className="border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={async () => {
                    const { createClient } = await import("@/lib/supabase/client");
                    await createClient().auth.signOut();
                    closeMenu();
                    window.location.href = "/";
                  }}
                  className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Sign Out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
