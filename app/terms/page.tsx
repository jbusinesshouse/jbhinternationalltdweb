import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { BRAND } from "@/lib/constants";
import { TERMS_AND_CONDITIONS } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms & Conditions for ${BRAND.name} — marketplace rules, VAT pricing, accounts, and liability.`,
};

export default function TermsPage() {
  return <LegalDocumentView document={TERMS_AND_CONDITIONS} />;
}
