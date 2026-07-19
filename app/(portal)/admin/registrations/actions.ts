"use server";

import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Both actions re-fetch the profile through the caller's own RLS-bound client
// before mutating; approve_profile()/reject_profile() re-check admin status
// again server-side, so this is defense-in-depth, not the only gate.
export async function approveRegistration(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = formData.get("profileId");
  if (typeof profileId !== "string") return { error: "Invalid request." };

  const supabase = await createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("name, role, whatsapp_number")
    .eq("id", profileId)
    .single();
  if (fetchError || !profile) return { error: "Registration not found." };

  const { error } = await supabase.rpc("approve_profile", { p_profile_id: profileId });
  if (error) return { error: "Could not approve this registration." };

  if (profile.whatsapp_number) {
    await notify("whatsapp", profile.whatsapp_number, "registration_approved", {
      name: profile.name,
      role: profile.role,
      portalUrl: `${PORTAL_URL}/login`,
    });
  }

  revalidatePath("/admin/registrations/student");
  revalidatePath("/admin/registrations/teacher");
}

export async function rejectRegistration(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = formData.get("profileId");
  const reason = formData.get("reason");
  if (typeof profileId !== "string" || typeof reason !== "string" || !reason.trim()) {
    return { error: "Please provide a rejection reason." };
  }

  const supabase = await createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("name, whatsapp_number")
    .eq("id", profileId)
    .single();
  if (fetchError || !profile) return { error: "Registration not found." };

  const { error } = await supabase.rpc("reject_profile", { p_profile_id: profileId, p_reason: reason });
  if (error) return { error: "Could not reject this registration." };

  if (profile.whatsapp_number) {
    await notify("whatsapp", profile.whatsapp_number, "registration_rejected", {
      name: profile.name,
      reason,
    });
  }

  revalidatePath("/admin/registrations/student");
  revalidatePath("/admin/registrations/teacher");
}
