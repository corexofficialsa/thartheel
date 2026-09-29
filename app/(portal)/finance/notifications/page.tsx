import { NotificationsPage } from "@/components/notifications/notifications-page";
import { requireRole } from "@/lib/auth/session";

export default async function FinanceNotificationsPage() {
  const profile = await requireRole("finance");
  return <NotificationsPage userId={profile.id} />;
}
