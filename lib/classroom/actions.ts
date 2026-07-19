"use server";

import { createClient } from "@/lib/supabase/server";

export type JoinClassroomResult =
  | { ok: true; locked: false; meetingLink: string | null }
  | { ok: true; locked: true; reason: string }
  | { ok: false; error: string };

// Shared by both student and teacher "join" buttons — the join_classroom()
// RPC handles authorization, the homework access-lock check, and attendance
// logging atomically, so this action is just a thin pass-through.
export async function joinClassroom(classroomId: string): Promise<JoinClassroomResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_classroom", { p_classroom_id: classroomId });

  if (error || !data) {
    return { ok: false, error: "Could not join this classroom." };
  }

  if (data.locked) {
    return { ok: true, locked: true, reason: data.reason ?? "homework_incomplete" };
  }

  return { ok: true, locked: false, meetingLink: data.meeting_link ?? null };
}
