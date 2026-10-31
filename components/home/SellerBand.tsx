import Link from "next/link";
import { LINKS } from "@/lib/constants";

export function SellerBand({ isSeller }: { isSeller: boolean }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] bg-navy px-6 py-8 text-white sm:px-10 sm:py-9">
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
        <h2 className="text-2xl font-extrabold leading-snug sm:text-[28px]">
          আপনার পণ্য সারা দেশের রিটেইলারের কাছে পৌঁছে দিন
        </h2>
        <p className="leading-relaxed text-[#C9D3E6]">
          ফ্রি সেলার অ্যাকাউন্ট খুলুন। পণ্য আপলোড, অর্ডার ম্যানেজ, বিজ্ঞাপন — সব ওয়েবসাইট থেকেই।
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={isSeller ? "/hub" : "/sign-up"}
          className="inline-flex h-[52px] items-center rounded-2xl bg-primary px-6 font-bold text-primary-ink hover:bg-primary-dark"
        >
          {isSeller ? "সেলার হাবে যান" : "সেলার অ্যাকাউন্ট খুলুন"}
        </Link>
        <a
          href={LINKS.playStore}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center rounded-2xl border-[1.5px] border-[#3A4B6E] px-6 font-bold hover:bg-white/10"
        >
          অ্যাপ ডাউনলোড
        </a>
      </div>
    </section>
  );
}
