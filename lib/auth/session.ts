import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileStatus, UserRole } from "@/lib/supabase/types";
import { decodeProfileHeader } from "./profile-header";

export type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
  name: string;
  email: string;
};

// Second-layer defense-in-depth: middleware already gates by role/status per
// route group and forwards the verified profile via the x-profile header
// (see proxy.ts), so this only re-queries Supabase when that header is
// missing — a route middleware doesn't cover — rather than re-doing the same
// auth round-trip on every single portal page.
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const headerList = await headers();
  const forwarded = headerList.get("x-profile");
  if (forwarded) {
    const profile = decodeProfileHeader<CurrentProfile>(forwarded);
    if (profile) return profile;
  }

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
