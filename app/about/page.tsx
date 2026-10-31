import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description: `${BRAND.name} — পাইকারি পোশাক বিক্রেতা ও রিটেইলারদের সংযোগকারী বাংলাদেশের B2B মার্কেটপ্লেস।`,
};

const sections = [
  {
    title: "আমরা কারা",
    content:
      "JBH International Limited একটি B2B মার্কেটপ্লেস, যেখানে পোশাকের পাইকারি বিক্রেতা ও রিটেইলাররা সহজে, দ্রুত ও নির্ভরযোগ্যভাবে একে অপরের সাথে যুক্ত হতে পারেন।",
  },
  {
    title: "আমরা কী করি",
    content:
      "আমাদের প্ল্যাটফর্মে পাইকারি বিক্রেতারা তাদের পোশাক তুলে ধরেন, আর রিটেইলাররা সরাসরি বিশ্বস্ত সরবরাহকারীর কাছ থেকে পণ্য খুঁজে, তুলনা করে ও কিনতে পারেন।",
  },
  {
    title: "কাদের জন্য",
    content:
      "পোশাকের পাইকারি বিক্রেতা এবং যেসব রিটেইলার ব্যবসা সহজে সোর্সিং, কম হাতে-কলমে যোগাযোগ আর ভালোভাবে অর্ডার ম্যানেজ করতে চান — তাদের জন্য।",
  },
  {
    title: "আমাদের লক্ষ্য",
    content:
      "স্বচ্ছ, ডিজিটাল-ফার্স্ট প্ল্যাটফর্মের মাধ্যমে পাইকারি থেকে খুচরা পর্যন্ত পুরো প্রক্রিয়া সহজ করা — যাতে সময় বাঁচে এবং ব্যবসা বড় হয়।",
  },
  {
    title: "আমাদের অঙ্গীকার",
    content:
      "পারফরম্যান্স, নিরাপত্তা ও ব্যবহারযোগ্যতা ক্রমাগত উন্নত করে পাইকারি বিক্রেতা ও রিটেইলার — দুই পক্ষেরই অভিজ্ঞতা ভালো করা।",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="rounded-[22px] bg-primary p-7 sm:p-10">
        <span className="rounded-full bg-navy px-3 py-1.5 text-[13px] font-bold text-white">আমাদের সম্পর্কে</span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-primary-ink sm:text-4xl">
          {BRAND.name}
        </h1>
        <p className="mt-3 text-lg text-[#3A2410]">বাংলাদেশের পাইকারি পোশাকের B2B মার্কেটপ্লেস</p>
      </header>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-xl font-extrabold">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-[#374151]">{section.content}</p>
          </section>
        ))}
      </div>

      <section className="rounded-[22px] bg-navy p-7 text-center text-white sm:p-9">
        <h2 className="text-2xl font-extrabold">শুরু করতে প্রস্তুত?</h2>
        <p className="mt-2 text-[#C9D3E6]">সাইন ইন ছাড়াই পণ্য দেখুন, অথবা অর্ডার করতে অ্যাকাউন্ট খুলুন।</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/products" size="lg">পণ্য দেখুন</Button>
          <Button href="/sign-up" variant="outline" size="lg">অ্যাকাউন্ট খুলুন</Button>
        </div>
      </section>
    </div>
  );
}
