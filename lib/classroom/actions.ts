"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type JoinClassroomResult =
  | { ok: true; locked: false; meetingLink: string | null }
  | { ok: true; locked: true; reason: "join_window_closed" | "homework_incomplete" }
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
    const reason = data.reason === "join_window_closed" ? "join_window_closed" : "homework_incomplete";
    return { ok: true, locked: true, reason };
  }

  return { ok: true, locked: false, meetingLink: data.meeting_link ?? null };
}

export type SetJoinLockResult = { ok: true } | { ok: false; error: string };

// p_locked: true = force locked, false = force open, null = back to
// automatic (the 20-minute-after-teacher-joins rule).
export async function setClassroomJoinLock(classroomId: string, locked: boolean | null): Promise<SetJoinLockResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_classroom_join_lock", { p_classroom_id: classroomId, p_locked: locked });
  if (error) return { ok: false, error: "Could not update the join lock." };

  revalidatePath("/teacher/classrooms");
  return { ok: true };
}
