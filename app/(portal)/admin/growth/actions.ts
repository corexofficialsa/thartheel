"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function addLead(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const source = formData.get("source");
  const name = formData.get("name");
  const contact = formData.get("contact");
  const notes = formData.get("notes");

  if (typeof source !== "string" || !source.trim()) return { error: "Enter a source (e.g. Instagram, referral)." };
  if (typeof name !== "string" || !name.trim()) return { error: "Enter a name." };
  if (typeof contact !== "string" || !contact.trim()) return { error: "Enter a contact (phone or email)." };

  const supabase = await createClient();
  const { error } = await supabase.from("campaign_leads").insert({
    source: source.trim(),
    name: name.trim(),
    contact: contact.trim(),
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });

  if (error) return { error: "Could not save lead." };
  revalidatePath("/admin/growth");
}

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const leadId = formData.get("leadId");
  const status = formData.get("status");
  if (typeof leadId !== "string" || typeof status !== "string") return;
  if (!["new", "contacted", "converted", "lost"].includes(status)) return;

  const supabase = await createClient();
  await supabase.from("campaign_leads").update({ status: status as "new" | "contacted" | "converted" | "lost" }).eq("id", leadId);

  revalidatePath("/admin/growth");
}
