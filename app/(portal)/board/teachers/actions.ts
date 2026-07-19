"use server";

import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function removeTeacher(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = formData.get("profileId");
  const reason = formData.get("reason");
  if (typeof profileId !== "string" || typeof reason !== "string" || !reason.trim()) {
    return { error: "Please provide a reason." };
  }

  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("profiles")
    .select("name, whatsapp_number")
    .eq("id", profileId)
    .single();

  const { error } = await supabase.rpc("remove_profile", { p_profile_id: profileId, p_reason: reason });
  if (error) return { error: "Could not remove this teacher." };

  if (teacher?.whatsapp_number) {
    await notify("whatsapp", teacher.whatsapp_number, "account_removed", { name: teacher.name, reason });
  }

  revalidatePath("/board/teachers");
}
