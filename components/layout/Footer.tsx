import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/constants";

const columns = [
  {
    title: "ক্রেতা",
    links: [
      { href: "/products", label: "সব পণ্য" },
      { href: "/orders", label: "অর্ডার ট্র্যাক" },
      { href: "/support", label: "সাহায্য" },
    ],
  },
  {
    title: "সেলার",
    links: [
      { href: "/hub", label: "সেলার হাব" },
      { href: "/product-upload", label: "পণ্য আপলোড" },
      { href: "/advertise-product", label: "বিজ্ঞাপন দিন" },
    ],
  },
  {
    title: "কোম্পানি",
    links: [
      { href: "/about", label: "আমাদের সম্পর্কে" },
      { href: LINKS.termsAndConditions, label: "শর্তাবলী" },
      { href: LINKS.privacyPolicy, label: "প্রাইভেসি পলিসি" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-10 bg-navy-dark text-sm text-[#C9D3E6]">
      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Image
            src="/jbh-logo-white.png"
            alt="JBH International Limited"
            width={180}
            height={52}
            className="h-auto w-[180px]"
          />
          <p className="leading-relaxed">আহমেদ টাওয়ার, বনানী, ঢাকা</p>
          <a
            href={LINKS.playStore}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#FFB27A] hover:text-white"
          >
            Google Play থেকে অ্যাপ নিন →
          </a>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5">
            <p className="font-bold text-white">{col.title}</p>
            {col.links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-[#1E2C4A] px-4 py-4 text-center text-[13px]">
        © {new Date().getFullYear()} JBH International Limited
      </div>
    </footer>
  );
}
