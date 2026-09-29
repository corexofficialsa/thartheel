import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "./kinds";

export type UnreadCounts = { notifications: number; messages: number };

export async function getUnreadCounts(userId: string): Promise<UnreadCounts> {
  const supabase = await createClient();
  const [{ count: notifications }, { count: messages }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "message")
      .is("read_at", null),
  ]);
  return { notifications: notifications ?? 0, messages: messages ?? 0 };
}

// The latest few notifications for the top-bar bell.
export async function getRecentNotifications(userId: string, limit = 8): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Unread message counts keyed the same way chat contacts are: a classroom
// group chat by its classroom id, a 1:1 chat by the other person's id.
export async function getUnreadByContact(userId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data: unread } = await supabase
    .from("notifications")
    .select("classroom_id, actor_id")
    .eq("user_id", userId)
    .eq("kind", "message")
    .is("read_at", null);

  const counts: Record<string, number> = {};
  for (const n of unread ?? []) {
    const key = n.classroom_id ?? n.actor_id;
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
