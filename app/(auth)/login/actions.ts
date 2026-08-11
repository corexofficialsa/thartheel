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
    role: formData.get("role") || undefined,
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

  // Only the student/teacher forms steer by role (they send one); the staff
  // form sends none, so admin/board/finance — and anyone else — logs in
  // straight through to whatever portal their actual role redirects to.
  if (
    parsed.data.role &&
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

  // Students and teachers land straight in their classrooms rather than
  // the stats dashboard — "Home" in the nav still reaches the dashboard.
  const LANDING_PATH: Partial<Record<typeof profile.role, string>> = {
    student: "/student/classrooms",
    teacher: "/teacher/classrooms",
  };
  redirect(LANDING_PATH[profile.role] ?? `/${profile.role}`);
}
