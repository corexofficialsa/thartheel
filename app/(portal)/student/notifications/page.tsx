import { NotificationsPage } from "@/components/notifications/notifications-page";
import { requireRole } from "@/lib/auth/session";

export default async function StudentNotificationsPage() {
  const profile = await requireRole("student");
  return <NotificationsPage userId={profile.id} />;
}
