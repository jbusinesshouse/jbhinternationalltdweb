import Link from "next/link";
import { ReactNode } from "react";
import { DashboardChips, DashboardNav } from "@/components/account/DashboardNav";
import { Avatar } from "@/components/layout/AccountMenu";
import { STORE_TYPE_LABEL } from "@/lib/labels";
import type { UserProfile } from "@/lib/profile";

const footerLinks = [
  { href: "/about", label: "আমাদের সম্পর্কে" },
  { href: "/privacy-policy", label: "প্রাইভেসি পলিসি" },
  { href: "/terms", label: "শর্তাবলী" },
];

type DashboardShellProps = {
  children: ReactNode;
  profile: UserProfile;
};

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const name = profile.store_name || profile.full_name || "অ্যাকাউন্ট";

  return (
    <div className="mx-auto flex max-w-[1320px] gap-6 px-4 py-5 sm:px-6 sm:py-6">
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-[150px] flex flex-col gap-4 rounded-[18px] border border-border bg-white p-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Avatar profile={profile} name={name} size={44} />
            <div className="min-w-0">
              <p className="truncate font-extrabold">{name}</p>
              <p className="truncate text-xs text-muted">{profile.email}</p>
              {profile.store_type && (
                <span
                  className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    profile.store_type === "retail" ? "bg-teal-soft text-teal" : "bg-navy-soft text-navy"
                  }`}
                >
                  {STORE_TYPE_LABEL[profile.store_type]}
                </span>
              )}
            </div>
          </div>

          <DashboardNav profile={profile} />

          <div className="flex flex-col gap-1 border-t border-border pt-3">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-3 py-1.5 text-xs text-muted hover:text-primary-strong">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <DashboardChips profile={profile} />
        {profile.status && profile.status !== "active" && (
          <div
            role="status"
            className={`mb-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
              profile.status === "freeze" ? "bg-[#FEECEC] text-[#B42318]" : "bg-[#FFF1D6] text-[#8A4B00]"
            }`}
          >
            {profile.status === "freeze"
              ? "আপনার অ্যাকাউন্ট ফ্রিজ করা আছে। অর্ডার, বিক্রি ও মেসেজ বন্ধ। সাপোর্টে যোগাযোগ করুন।"
              : "আপনার অ্যাকাউন্ট যাচাইয়ের অপেক্ষায় (restricted)। যাচাই না হওয়া পর্যন্ত বিক্রি বন্ধ; ব্রাউজ ও অর্ডার চলবে।"}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
