import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { BRAND } from "@/lib/constants";
import { PRIVACY_POLICY } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${BRAND.name} — how we collect, use, and protect your data on our B2B clothing marketplace.`,
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentView document={PRIVACY_POLICY} />;
}
