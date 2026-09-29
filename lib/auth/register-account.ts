import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SkillLevel, UserRole } from "@/lib/supabase/types";

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
  // Student registration form answers (see lib/registration/student-options.ts).
  details?: {
    gender: "male" | "female";
    address: string;
    makharijLevel: SkillLevel;
    qaidaLevel: SkillLevel;
    tajweedLevel: SkillLevel;
    preferredTimeSlot: string;
  } | null;
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
    ...(input.details
      ? {
          gender: input.details.gender,
          address: input.details.address,
          makharij_level: input.details.makharijLevel,
          qaida_level: input.details.qaidaLevel,
          tajweed_level: input.details.tajweedLevel,
          preferred_time_slot: input.details.preferredTimeSlot,
          terms_accepted_at: new Date().toISOString(),
        }
      : {}),
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
    const extension =
      { "audio/webm": "webm", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/ogg": "ogg" }[
        audio.type.split(";")[0]
      ] ?? "webm";
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

  // Students go to finance for a registration-fee invoice before an admin
  // can approve them (see approve_profile() in 0018_finance_payment_gate.sql).
  // Teachers don't pay a registration fee, so this is student-only.
  if (input.role === "student") {
    await supabase.from("fee_invoices").insert({
      student_id: userId,
      period: "registration",
      amount: 100,
    });
  }

  return { ok: true };
}
