import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileStatus, UserRole } from "@/lib/supabase/types";

export type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
  name: string;
  email: string;
};

// Second-layer defense-in-depth: middleware already gates by role/status per
// route group, but any Server Component/Action reachable from multiple roles
// should still re-check here rather than trusting the URL alone.
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, name, email")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireRole(...roles: UserRole[]): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active" || !roles.includes(profile.role)) {
    redirect("/login");
  }
  return profile;
}
