"use server";

import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type StartConversationResult = { ok: true; conversationId: string } | { ok: false; error: string };

// start_conversation() validates the pairing server-side (shared classroom
// for student<->teacher, unrestricted for teacher<->board) so the client
// never decides on its own whether a conversation is allowed.
export async function startConversation(otherUserId: string): Promise<StartConversationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", { p_other_user_id: otherUserId });
  if (error || !data) return { ok: false, error: "Could not start this conversation." };
  return { ok: true, conversationId: data };
}

export type ChatMessage = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };

export type SendMessageResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

export async function sendMessage(conversationId: string, content: string): Promise<SendMessageResult> {
  if (!content.trim()) return { ok: false, error: "Message cannot be empty." };

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  const supabase = await createClient();

  // Returns the inserted row so the sender's own UI can show it immediately
  // instead of depending entirely on the Realtime subscription to echo it
  // back — the send would otherwise silently appear to do nothing if
  // Realtime is slow, briefly disconnected, or misconfigured.
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: content.trim(),
    })
    .select("id, conversation_id, sender_id, content, created_at")
    .single();
  if (error || !data) return { ok: false, error: "Could not send message." };
  return { ok: true, message: data };
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
