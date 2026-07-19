"use server";

import { registerAccount } from "@/lib/auth/register-account";
import { teacherRegistrationSchema } from "@/lib/validation/registration";

export type RegisterState = { error?: string; success?: boolean } | undefined;

export async function registerTeacher(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = teacherRegistrationSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
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

  const cv = formData.get("cv");

  const result = await registerAccount({
    role: "teacher",
    name: parsed.data.name,
    username: parsed.data.username,
    email: parsed.data.email,
    password: parsed.data.password,
    phone: parsed.data.phone,
    whatsappNumber: parsed.data.whatsappNumber,
    levelId: parsed.data.levelId,
    cv: cv instanceof File && cv.size > 0 ? cv : null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true };
}
