import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications/notifications-page";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function BoardNotificationsPage() {
  const profile = await requireRole("board");
  return <NotificationsPage userId={profile.id} />;
}
