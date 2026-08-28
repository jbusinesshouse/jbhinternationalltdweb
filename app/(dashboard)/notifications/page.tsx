import { NotificationsList } from "@/components/notifications/NotificationsList";
import { getAuthSession } from "@/lib/auth";

export default async function NotificationsPage() {
  const { profile } = await getAuthSession();
  if (!profile) return null;
  return <NotificationsList profile={profile} />;
}
