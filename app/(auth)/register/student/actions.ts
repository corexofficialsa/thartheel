"use server";

import { registerAccount } from "@/lib/auth/register-account";
import { MAX_RECITATION_BYTES, OPEN_LEVEL_NAMES } from "@/lib/registration/student-options";
import { createClient } from "@/lib/supabase/server";
import { studentRegistrationSchema } from "@/lib/validation/registration";

export type RegisterState = { error?: string; success?: boolean } | undefined;

export async function registerStudent(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const field = (name: string) => formData.get(name) ?? "";
  const parsed = studentRegistrationSchema.safeParse({
    name: field("name"),
    gender: field("gender"),
    age: field("age"),
    place: field("place"),
    address: field("address"),
    phone: field("phone"),
    whatsappNumber: field("whatsappNumber"),
    email: field("email"),
    makharij: field("makharij"),
    qaida: field("qaida"),
    tajweed: field("tajweed"),
    levelId: field("levelId"),
    timeSlot: field("timeSlot"),
    password: field("password"),
    confirmPassword: field("confirmPassword"),
    termsAccepted: field("termsAccepted"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  // Only programs marked open in student-options.ts accept registrations.
  const supabase = await createClient();
  const { data: level } = await supabase.from("levels").select("name").eq("id", data.levelId).maybeSingle();
  if (!level || !OPEN_LEVEL_NAMES.includes(level.name)) {
    return { error: "Admissions for that program aren't open yet. Please choose Level 1 (Al Asas)." };
  }

  const recitationAudio = formData.get("recitationAudio");
  const recitationAyahId = formData.get("recitationAyahId");
  if (!(recitationAudio instanceof File) || recitationAudio.size === 0 || typeof recitationAyahId !== "string" || !recitationAyahId) {
    return { error: "Please record or upload your recitation of the ayah." };
  }
  if (recitationAudio.size > MAX_RECITATION_BYTES) {
    return { error: "The recitation file is too large (max 8 MB). Please record a shorter clip." };
  }
  if (recitationAudio.type && !recitationAudio.type.startsWith("audio/")) {
    return { error: "The recitation must be an audio file." };
  }

  const result = await registerAccount({
    role: "student",
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone,
    whatsappNumber: data.whatsappNumber,
    levelId: data.levelId,
    age: data.age,
    place: data.place,
    recitation: { ayahId: recitationAyahId, audio: recitationAudio },
    details: {
      gender: data.gender,
      address: data.address,
      makharijLevel: data.makharij,
      qaidaLevel: data.qaida,
      tajweedLevel: data.tajweed,
      preferredTimeSlot: data.timeSlot,
    },
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true };
}
