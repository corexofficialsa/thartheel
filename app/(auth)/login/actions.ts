"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export type LoginState = { error?: string } | undefined;

const GENERIC_ERROR = "Invalid credentials, or your account isn't active yet.";

export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const rememberMe = formData.get("rememberMe") != null;
  const supabase = await createClient({ rememberMe });

  const { data: email, error: resolveError } = await supabase.rpc("resolve_login_identifier", {
    p_identifier: parsed.data.identifier,
  });
  if (resolveError || !email) {
    return { error: GENERIC_ERROR };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (signInError || !signInData.user) {
    return { error: GENERIC_ERROR };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", signInData.user.id)
    .single();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    if (profile?.status === "pending") {
      return { error: "Your registration is still awaiting admin approval." };
    }
    return { error: GENERIC_ERROR };
  }

  // Only student/teacher accounts are steered by which login form was used —
  // board/finance/admin accounts can use either form without friction, since
  // there's no separate login route for them.
  if (
    (profile.role === "student" || profile.role === "teacher") &&
    profile.role !== parsed.data.role
  ) {
    await supabase.auth.signOut();
    return {
      error:
        profile.role === "teacher"
          ? "This is a teacher account — use teacher log in."
          : "This is a student account — use student log in.",
    };
  }

  redirect(`/${profile.role}`);
}
