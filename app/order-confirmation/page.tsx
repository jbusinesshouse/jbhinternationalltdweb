import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "অর্ডার সম্পন্ন", robots: { index: false } };

type Props = {
  searchParams: Promise<{ orderId?: string; phone?: string }>;
};

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.orderId?.trim();
  const phone = params.phone?.trim();

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[22px] border border-border bg-white p-6 text-center sm:p-9">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-soft text-teal">
          <CheckIcon size={32} strokeWidth={2.4} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">অর্ডার সম্পন্ন হয়েছে</h1>
        <p className="mt-1.5 text-muted">ধন্যবাদ! আমরা আপনার অর্ডার পেয়েছি। সেলার শিগগিরই যোগাযোগ করবেন।</p>

        <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-surface p-4 text-left text-sm">
          {orderId ? (
            <p>
              অর্ডার আইডি: <span className="break-all font-mono font-bold">{orderId}</span>
            </p>
          ) : (
            <p className="text-muted">আপনার অর্ডার জমা হয়েছে। রেফারেন্সের জন্য কনফার্মেশন SMS রেখে দিন।</p>
          )}
          {phone && (
            <p className="text-muted">
              যে নম্বরে কনফার্ম হয়েছে: <span className="font-bold text-foreground">…{phone.slice(-4)}</span>
            </p>
          )}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted">
          অর্ডার আইডিটি সংরক্ষণ করে রাখুন। সেলার আপনার দেওয়া নম্বরে যোগাযোগ করবেন। ভবিষ্যতে অর্ডার করতে চাইলে অ্যাকাউন্ট খুলে নিতে পারেন।
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button href="/products" size="lg">কেনাকাটা চালিয়ে যান</Button>
          <Button href="/sign-up" variant="outline" size="lg">অ্যাকাউন্ট খুলুন</Button>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/sign-in" className="font-bold text-primary-strong hover:underline">সাইন ইন</Link>
        </p>
      </div>
    </div>
  );
}
