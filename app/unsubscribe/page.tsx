import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/email/UnsubscribeForm";

export const metadata: Metadata = {
  title: "ইমেইল বন্ধ করুন",
  description: "JBH International Limited-এর ইমেইল বন্ধ করুন।",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ e?: string | string[]; t?: string | string[] }>;
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  return <UnsubscribeForm email={first(params.e)} token={first(params.t)} />;
}
