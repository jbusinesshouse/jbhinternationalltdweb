import { HeaderBar } from "@/components/layout/HeaderBar";
import { getAuthSession } from "@/lib/auth";

export async function Header() {
  const { user, profile } = await getAuthSession();
  return <HeaderBar user={user} profile={profile} />;
}
