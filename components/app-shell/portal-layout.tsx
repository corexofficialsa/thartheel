import { requireRole } from "@/lib/auth/session";
import { getRecentNotifications, getUnreadCounts } from "@/lib/notifications/counts";
import type { UserRole } from "@/lib/supabase/types";
import { AppShell } from "./app-shell";

export async function PortalLayout({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const profile = await requireRole(role);
  const [unread, recent] = await Promise.all([getUnreadCounts(profile.id), getRecentNotifications(profile.id)]);

  return (
    <AppShell role={profile.role} name={profile.name} userId={profile.id} unread={unread} recent={recent}>
      {children}
    </AppShell>
  );
}
