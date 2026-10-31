import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { BRAND, LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "অ্যাপ ডাউনলোড",
  description: `${BRAND.name}-এর Android অ্যাপ নিন — যেকোনো জায়গা থেকে অর্ডার, চ্যাট ও ব্যবসা ম্যানেজ করুন।`,
};

const appFeatures = [
  "পাইকারি পণ্য দেখুন ও অর্ডার করুন",
  "সেলারের সাথে সরাসরি চ্যাট",
  "অর্ডার ও বিক্রি ট্র্যাক করুন",
  "পাইকারি সেলারদের জন্য দোকান ম্যানেজমেন্ট",
  "নতুন অর্ডার ও মেসেজের পুশ নোটিফিকেশন",
];

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid items-center gap-8 rounded-[22px] border border-border bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            JBH অ্যাপ নিন
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            আপনার পাইকারি পোশাকের ব্যবসা এখন পকেটে। অর্ডার, চ্যাট আর ম্যানেজমেন্ট — সবকিছু যেকোনো জায়গা থেকে।
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {appFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
                  <CheckIcon size={16} strokeWidth={2.6} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={LINKS.playStore} size="lg">Google Play থেকে নিন</Button>
            <Button href="/products" variant="outline" size="lg">ওয়েবে দেখুন</Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-xs rounded-[28px] bg-navy p-8 text-center">
            <Image src="/favicon.png" alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-3xl" />
            <p className="mt-4 text-lg font-extrabold text-white">{BRAND.name}</p>
            <p className="mt-1 text-sm text-[#C9D3E6]">Android অ্যাপ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
