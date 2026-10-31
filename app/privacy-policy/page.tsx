import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { BRAND } from "@/lib/constants";
import { PRIVACY_POLICY } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "প্রাইভেসি পলিসি",
  description: `${BRAND.name}-এর প্রাইভেসি পলিসি — আমরা আপনার তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখি। Privacy Policy.`,
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentView document={PRIVACY_POLICY} />;
}
