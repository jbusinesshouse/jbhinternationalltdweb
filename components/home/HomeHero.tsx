import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { Category } from "@/lib/categories";
import { categoryLabel } from "@/lib/labels";
import type { ProductFeedItem } from "@/lib/productFeed";
import type { UserProfile } from "@/lib/profile";

type HomeHeroProps = {
  categories: Category[];
  showcase: ProductFeedItem[];
  user: User | null;
  profile: UserProfile | null;
};

export function HomeHero({ categories, showcase, user, profile }: HomeHeroProps) {
  const [big, ...small] = showcase.filter((p) => p.productImg).slice(0, 3);
  const name = profile?.store_name || profile?.full_name;
  const isSeller = profile?.store_type === "wholesale" || profile?.store_type === "retail";

  return (
    <section className="flex flex-wrap items-stretch gap-4 lg:gap-5">
      <nav
        aria-label="ক্যাটাগরি"
        className="hidden w-[250px] shrink-0 flex-col gap-1 rounded-[18px] border border-border bg-white p-4 lg:flex"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted">ক্যাটাগরি</p>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.id}`}
            className="flex items-center justify-between rounded-xl px-3 py-3 font-semibold hover:bg-primary-soft"
          >
            {categoryLabel(c.name)} পোশাক
            <ChevronRightIcon size={18} className="text-muted" />
          </Link>
        ))}
        <div className="my-2 h-px bg-border" />
        <Link href="/products" className="rounded-xl px-3 py-3 font-bold text-primary-strong hover:bg-primary-soft">
          সব পণ্য দেখুন →
        </Link>
      </nav>

      <div className="relative flex min-w-0 flex-[999_1_520px] flex-wrap items-center gap-6 overflow-hidden rounded-[22px] bg-primary p-6 sm:p-10">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <span className="self-start rounded-full bg-navy px-3 py-1.5 text-[13px] font-bold text-white">
            B2B · পাইকারি মার্কেটপ্লেস
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-primary-ink sm:text-[44px]">
            পাইকারি দামে সরাসরি সেলারের কাছ থেকে কিনুন
          </h1>
          <p className="text-base leading-relaxed text-[#3A2410] sm:text-[17px]">
            ভ্যাটসহ স্পষ্ট দাম, MOQ অনুযায়ী অর্ডার, আর সেলারের সাথে সরাসরি চ্যাট — সব এক জায়গায়।
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex h-[52px] items-center rounded-2xl bg-navy px-6 font-bold text-white hover:bg-navy-dark">
              পণ্য দেখুন
            </Link>
            <Link
              href={isSeller ? "/product-upload" : "/sign-up"}
              className="inline-flex h-[52px] items-center rounded-2xl bg-white px-6 font-bold text-primary-ink hover:bg-primary-soft"
            >
              {isSeller ? "নতুন পণ্য আপলোড" : "সেলার হিসেবে যোগ দিন"}
            </Link>
          </div>
        </div>
        {big && (
          <div className="grid min-w-0 flex-[1_1_280px] grid-cols-2 gap-3">
            <Link href={`/products/${big.id}`} className="relative row-span-2 h-[220px] overflow-hidden rounded-2xl sm:h-[300px]">
              <Image src={big.productImg!} alt={big.name} fill priority className="object-cover" sizes="(max-width: 1024px) 45vw, 260px" />
            </Link>
            {small.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="relative h-[104px] overflow-hidden rounded-2xl sm:h-[144px]">
                <Image src={p.productImg!} alt={p.name} fill className="object-cover" sizes="(max-width: 1024px) 45vw, 200px" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="hidden w-[270px] shrink-0 flex-col gap-4 xl:flex">
        <div className="flex flex-col gap-3 rounded-[18px] border border-border bg-white p-5">
          {user ? (
            <>
              <p className="text-lg font-extrabold">স্বাগতম{name ? `, ${name}` : ""}</p>
              <p className="text-sm leading-relaxed text-muted">আপনার অর্ডার আর মেসেজ এক জায়গায় দেখুন।</p>
              <Link href="/orders" className="flex h-[46px] items-center justify-center rounded-xl bg-primary font-bold text-primary-ink hover:bg-primary-dark">
                আমার অর্ডার
              </Link>
              <Link href="/messages" className="flex h-[46px] items-center justify-center rounded-xl border-[1.5px] border-[#D1D5DB] font-semibold hover:bg-surface">
                মেসেজ
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-extrabold">স্বাগতম</p>
              <p className="text-sm leading-relaxed text-muted">
                অর্ডার ট্র্যাক, সেলারের সাথে চ্যাট আর দ্রুত চেকআউটের জন্য সাইন ইন করুন।
              </p>
              <Link href="/sign-in" className="flex h-[46px] items-center justify-center rounded-xl bg-primary font-bold text-primary-ink hover:bg-primary-dark">
                সাইন ইন
              </Link>
              <Link href="/sign-up" className="flex h-[46px] items-center justify-center rounded-xl border-[1.5px] border-[#D1D5DB] font-semibold hover:bg-surface">
                নতুন অ্যাকাউন্ট
              </Link>
            </>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2.5 rounded-[18px] bg-navy p-5 text-white">
          <p className="font-extrabold leading-snug">
            {isSeller ? "আপনার দোকান ম্যানেজ করুন" : "আপনি কি পাইকারি বিক্রেতা?"}
          </p>
          <p className="text-sm leading-relaxed text-[#C9D3E6]">
            পণ্য আপলোড করুন, অর্ডার নিন, বিজ্ঞাপন দিন — ওয়েবসাইট ও অ্যাপ দুটো থেকেই।
          </p>
          <Link href={isSeller ? "/hub" : "/sign-up"} className="font-bold text-[#FFB27A] hover:text-white">
            {isSeller ? "সেলার হাব →" : "সেলার অ্যাকাউন্ট খুলুন →"}
          </Link>
        </div>
      </aside>
    </section>
  );
}
