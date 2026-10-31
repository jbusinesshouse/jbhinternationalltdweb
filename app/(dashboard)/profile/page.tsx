import { ProfileHub } from "@/components/profile/ProfileHub";
import { PageHeader } from "@/components/ui/PageElements";
import { getAuthSession } from "@/lib/auth";

export default async function ProfilePage() {
  const { user } = await getAuthSession();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="প্রোফাইল" description="আপনার অ্যাকাউন্ট ও সেটিংস ম্যানেজ করুন" />
      <ProfileHub userId={user.id} userEmail={user.email ?? ""} />
    </div>
  );
}
