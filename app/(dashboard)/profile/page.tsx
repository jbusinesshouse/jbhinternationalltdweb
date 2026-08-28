import { ProfileHub } from "@/components/profile/ProfileHub";
import { PageHeader } from "@/components/ui/PageElements";
import { getAuthSession } from "@/lib/auth";

export default async function ProfilePage() {
  const { user } = await getAuthSession();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account and settings" />
      <ProfileHub userId={user.id} userEmail={user.email ?? ""} />
    </div>
  );
}
