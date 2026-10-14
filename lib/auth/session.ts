import "server-only";
import { cache } from "react";
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

// The role/status gate for every portal page and server action. Runs next to
// the database (the proxy only checks that a session exists). getClaims()
// verifies the session JWT locally, and React's cache() makes the layout,
// page and any helpers in one request share a single profile lookup.
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, name, email")
    .eq("id", userId)
    .single();

  return profile;
});

export async function requireRole(...roles: UserRole[]): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active" || !roles.includes(profile.role)) {
    redirect("/login");
  }
  return profile;
}
