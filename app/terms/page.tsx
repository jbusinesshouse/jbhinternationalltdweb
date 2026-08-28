import { redirect } from "next/navigation";
import { LINKS } from "@/lib/constants";

export default function TermsPage() {
  redirect(LINKS.termsAndConditions);
}
