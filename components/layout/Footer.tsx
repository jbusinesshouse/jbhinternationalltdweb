import Link from "next/link";
import { BRAND, LINKS } from "@/lib/constants";

const footerLinks = {
  marketplace: [
    { href: "/products", label: "Browse Products" },
    { href: "/search", label: "Search" },
    { href: "/download", label: "Download App" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: LINKS.privacyPolicy, label: "Privacy Policy", external: true },
    { href: LINKS.termsAndConditions, label: "Terms & Conditions", external: true },
  ],
  account: [
    { href: "/sign-in", label: "Sign In" },
    { href: "/sign-up", label: "Create Account" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-black text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-white">
              {BRAND.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              {BRAND.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Marketplace
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.marketplace.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Account
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
