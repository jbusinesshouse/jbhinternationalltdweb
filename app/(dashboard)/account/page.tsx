import { AccountDetails } from "@/components/account/AccountDetails";
import { PageHeader } from "@/components/ui/PageElements";
import { getAuthSession } from "@/lib/auth";

export default async function AccountPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;

  return (
    <div>
      <PageHeader
        title="আমার অ্যাকাউন্ট"
        description="আপনার প্রোফাইল, ঠিকানা ও পণ্য"
      />
      <AccountDetails profile={profile} />
    </div>
  );
}
