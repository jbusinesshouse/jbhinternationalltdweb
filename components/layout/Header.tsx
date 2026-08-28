import Link from "next/link";
import { AuthNav } from "@/components/layout/AuthNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { getAuthSession } from "@/lib/auth";
import { BRAND } from "@/lib/constants";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/download", label: "Get App" },
];

export async function Header() {
  const { user, profile } = await getAuthSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-black">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <span className="text-lg font-bold text-white sm:text-xl">
            {BRAND.shortName}
            <span className="hidden sm:inline"> International</span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block md:max-w-md lg:max-w-lg">
          <SearchBar placeholder="Search wholesale products..." size="sm" />
        </div>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {user && (
            <>
              <Link
                href="/messages"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white sm:inline"
              >
                Messages
              </Link>
              <Link
                href="/notifications"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white sm:inline"
              >
                Alerts
              </Link>
            </>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <AuthNav initialUser={user} initialProfile={profile} />
        </nav>
      </div>

      <div className="border-t border-white/10 px-4 pb-3 md:hidden">
        <SearchBar placeholder="Search products..." size="sm" />
      </div>
    </header>
  );
}
