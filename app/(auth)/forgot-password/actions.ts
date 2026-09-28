"use server";

import { notify } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export type ForgotPasswordState = { error?: string; sent?: boolean } | undefined;

const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

// Always answers the same way whether or not the email exists, so the form
// can't be used to discover who is registered. Passwords are stored hashed,
// so we can't send the current one — the email carries the user's login
// name plus a one-time link to choose a new password.
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" };
  const { email } = parsed.data;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("name, email, username, status")
    .eq("email", email)
    .maybeSingle();
  if (!profile || profile.status !== "active") return { sent: true };

  // Don't let the form be used to flood someone's inbox.
  const { count: recent } = await admin
    .from("notifications_log")
    .select("id", { count: "exact", head: true })
    .eq("recipient", profile.email)
    .eq("template_name", "password_reset")
    .gte("created_at", new Date(Date.now() - RESEND_COOLDOWN_MS).toISOString());
  if ((recent ?? 0) > 0) return { sent: true };

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: profile.email });
  if (error || !link.properties?.hashed_token) {
    console.error("[password-reset] generateLink failed:", error);
    return { sent: true };
  }

  await notify("email", profile.email, "password_reset", {
    name: profile.name,
    loginId: profile.username ?? profile.email,
    resetUrl: `${PORTAL_URL}/reset-password?token=${encodeURIComponent(link.properties.hashed_token)}`,
  });
  return { sent: true };
}
