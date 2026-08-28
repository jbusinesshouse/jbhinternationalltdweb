import { AccountDetails } from "@/components/account/AccountDetails";
import { PageHeader } from "@/components/ui/PageElements";
import { getAuthSession } from "@/lib/auth";

export default async function AccountPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;

  return (
    <div>
      <PageHeader
        title="My Account"
        description="Your profile details, addresses, and products"
      />
      <AccountDetails profile={profile} />
    </div>
  );
}
