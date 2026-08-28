import { redirect } from "next/navigation";
import { LINKS } from "@/lib/constants";

export default function PrivacyPolicyPage() {
  redirect(LINKS.privacyPolicy);
}
