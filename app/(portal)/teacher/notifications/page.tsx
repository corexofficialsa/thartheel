import { NotificationsPage } from "@/components/notifications/notifications-page";
import { requireRole } from "@/lib/auth/session";

export default async function TeacherNotificationsPage() {
  const profile = await requireRole("teacher");
  return <NotificationsPage userId={profile.id} />;
}
