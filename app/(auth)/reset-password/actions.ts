"use server";

import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export type ResetPasswordState = { error?: string; done?: boolean } | undefined;

// The token is only redeemed here, on submit — not when the page loads — so
// email scanners that pre-open links can't burn it before the user clicks.
export async function resetPassword(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    tokenHash: formData.get("tokenHash"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: parsed.data.tokenHash });
  if (verifyError) {
    return { error: "This reset link has expired or was already used. Request a new one." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
  await supabase.auth.signOut();
  if (updateError) {
    return {
      error: updateError.message.toLowerCase().includes("different")
        ? "Choose a password different from your current one."
        : "Could not update your password. Request a new link and try again.",
    };
  }
  return { done: true };
}
