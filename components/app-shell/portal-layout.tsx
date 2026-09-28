import { requireRole } from "@/lib/auth/session";
import { getUnreadCounts } from "@/lib/notifications/counts";
import type { UserRole } from "@/lib/supabase/types";
import { AppShell } from "./app-shell";

export async function PortalLayout({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const profile = await requireRole(role);
  const unread = await getUnreadCounts(profile.id);

  return (
    <AppShell role={profile.role} name={profile.name} userId={profile.id} unread={unread}>
      {children}
    </AppShell>
  );
}
