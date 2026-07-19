"use server";

import { registerAccount } from "@/lib/auth/register-account";
import { studentRegistrationSchema } from "@/lib/validation/registration";

export type RegisterState = { error?: string; success?: boolean } | undefined;

export async function registerStudent(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = studentRegistrationSchema.safeParse({
    name: formData.get("name"),
    age: formData.get("age"),
    place: formData.get("place"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsappNumber: formData.get("whatsappNumber"),
    levelId: formData.get("levelId"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const recitationAudio = formData.get("recitationAudio");
  const recitationAyahId = formData.get("recitationAyahId");

  const result = await registerAccount({
    role: "student",
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
    phone: parsed.data.phone,
    whatsappNumber: parsed.data.whatsappNumber,
    levelId: parsed.data.levelId,
    age: parsed.data.age,
    place: parsed.data.place,
    recitation:
      recitationAudio instanceof File && recitationAudio.size > 0 && typeof recitationAyahId === "string" && recitationAyahId
        ? { ayahId: recitationAyahId, audio: recitationAudio }
        : null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true };
}
