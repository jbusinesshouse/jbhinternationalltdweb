import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "সাইন ইন",
  description: "JBH অ্যাকাউন্টে সাইন ইন করে অর্ডার ও ব্যবসা ম্যানেজ করুন।",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-260px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[22px] border border-border bg-white p-6 sm:p-8">
        <Image src="/favicon.png" alt="" width={56} height={56} className="mb-4 h-14 w-14 rounded-2xl" />
        <h1 className="text-2xl font-extrabold tracking-tight">আবার স্বাগতম</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          অর্ডার করতে, সেলারের সাথে চ্যাট করতে ও ব্যবসা ম্যানেজ করতে সাইন ইন করুন।
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted">লোড হচ্ছে...</p>}>
            <SignInForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          সাইন ইন ছাড়াই পণ্য দেখা যায় —{" "}
          <Link href="/products" className="font-semibold text-primary-strong hover:underline">
            পণ্য দেখুন
          </Link>
        </p>
      </div>
    </div>
  );
}
