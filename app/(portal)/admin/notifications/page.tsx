import { NotificationsPage } from "@/components/notifications/notifications-page";
import { requireRole } from "@/lib/auth/session";

export default async function AdminNotificationsPage() {
  const profile = await requireRole("admin");
  return <NotificationsPage userId={profile.id} />;
}
