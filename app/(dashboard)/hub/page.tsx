import { HubContent } from "@/components/hub/HubContent";
import { getAuthSession } from "@/lib/auth";

export default async function HubPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  return <HubContent profile={profile} />;
}
