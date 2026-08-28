import { ReferralCreatorForm } from "@/components/promo/ReferralCreatorForm";
import { getAuthSession } from "@/lib/auth";

export default async function ReferralPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  return (
    <ReferralCreatorForm
      userId={profile.id}
      defaultName={profile.full_name ?? ""}
    />
  );
}
