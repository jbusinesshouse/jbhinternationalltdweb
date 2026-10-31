import type { Metadata } from "next";
import Image from "next/image";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "অ্যাকাউন্ট খুলুন",
  description: "JBH International Limited-এ ক্রেতা বা সেলার হিসেবে যোগ দিন — বাংলাদেশের পাইকারি পোশাকের মার্কেটপ্লেস।",
};

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[22px] border border-border bg-white p-6 sm:p-8">
        <Image src="/favicon.png" alt="" width={56} height={56} className="mb-4 h-14 w-14 rounded-2xl" />
        <h1 className="text-2xl font-extrabold tracking-tight">নতুন অ্যাকাউন্ট খুলুন</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          ক্রেতা বা সেলার হিসেবে JBH-এ যোগ দিন। এটা বিনামূল্যে।
        </p>
        <div className="mt-6">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
