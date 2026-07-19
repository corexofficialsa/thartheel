import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/lib/supabase/types";
import { AppShell } from "./app-shell";

export async function PortalLayout({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const profile = await requireRole(role);

  return (
    <AppShell role={profile.role} name={profile.name}>
      {children}
    </AppShell>
  );
}
