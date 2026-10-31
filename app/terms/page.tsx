import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { BRAND } from "@/lib/constants";
import { TERMS_AND_CONDITIONS } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "শর্তাবলী",
  description: `${BRAND.name}-এর শর্তাবলী — মার্কেটপ্লেসের নিয়ম, ভ্যাটসহ মূল্য, অ্যাকাউন্ট ও দায়বদ্ধতা। Terms & Conditions.`,
};

export default function TermsPage() {
  return <LegalDocumentView document={TERMS_AND_CONDITIONS} />;
}
