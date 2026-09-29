"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markAllNotificationsRead(): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
  revalidatePath(`/${profile.role}`, "layout");
}

// Opening one notification from the bell marks just that one read.
export async function markNotificationRead(id: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id)
    .is("read_at", null);
  revalidatePath(`/${profile.role}`, "layout");
}

// Opening a chat marks that conversation's message notifications read, so
// the chat's unread badge clears as soon as the messages are on screen.
export async function markConversationRead(conversationId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .eq("conversation_id", conversationId)
    .is("read_at", null);
}
