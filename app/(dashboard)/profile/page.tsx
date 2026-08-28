import { ProfileHub } from "@/components/profile/ProfileHub";
import { PageHeader } from "@/components/ui/PageElements";
import { getAuthSession } from "@/lib/auth";

export default async function ProfilePage() {
  const { user, profile } = await getAuthSession();
  if (!user || !profile) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account and settings" />
      <ProfileHub profile={profile} userEmail={user.email ?? ""} />
    </div>
  );
}
