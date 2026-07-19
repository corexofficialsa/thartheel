import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

type RegisterAccountInput = {
  role: Extract<UserRole, "student" | "teacher">;
  name: string;
  email: string;
  password: string;
  phone: string;
  whatsappNumber: string;
  levelId: string;
  username?: string | null;
  age?: number | null;
  place?: string | null;
  cv?: File | null;
  recitation?: { ayahId: string; audio: File } | null;
};

export type RegisterAccountResult = { ok: true } | { ok: false; error: string };

// Shared by both registration Server Actions: creates the auth user via the
// service-role client (never client-side signUp, so no session/confirmation
// email is triggered before an admin approves) and the pending profile row.
// Never returns a session — the account stays unusable until approve_profile().
export async function registerAccount(input: RegisterAccountInput): Promise<RegisterAccountResult> {
  const supabase = createAdminClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    if (createError?.code === "email_exists") {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: "Could not create your account. Please try again." };
  }

  const userId = created.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role: input.role,
    status: "pending",
    username: input.username ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone,
    whatsapp_number: input.whatsappNumber,
    level_id: input.levelId,
    age: input.age ?? null,
    place: input.place ?? null,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    if (profileError.code === "23505") {
      return { ok: false, error: "That username is already taken." };
    }
    return { ok: false, error: "Could not complete registration. Please try again." };
  }

  // A failed document upload doesn't roll back the whole registration —
  // admin can still approve, and the applicant can be asked to re-upload.
  if (input.cv && input.cv.size > 0) {
    const path = `${userId}/cv.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("admission-documents")
      .upload(path, input.cv, { contentType: input.cv.type || "application/pdf", upsert: true });

    if (!uploadError) {
      await supabase.from("admission_documents").insert({
        profile_id: userId,
        doc_type: "cv",
        file_url: path,
      });
    }
  }

  if (input.recitation) {
    const { ayahId, audio } = input.recitation;
    const extension = audio.type.includes("webm") ? "webm" : "bin";
    const path = `${userId}/recitation.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("registration-recitations")
      .upload(path, audio, { contentType: audio.type || "audio/webm", upsert: true });

    // A failed recitation upload doesn't roll back the whole registration —
    // an admin reviewing without audio can still approve or ask for a retry.
    if (!uploadError) {
      await supabase.from("student_recitations").insert({
        profile_id: userId,
        ayah_id: ayahId,
        audio_url: path,
      });
    }
  }

  return { ok: true };
}
