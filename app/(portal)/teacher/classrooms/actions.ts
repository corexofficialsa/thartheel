"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function updateMeetingLink(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const meetingLink = formData.get("meetingLink");
  if (typeof classroomId !== "string") return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("classrooms")
    .update({ meeting_link: typeof meetingLink === "string" ? meetingLink.trim() || null : null })
    .eq("id", classroomId);

  if (error) return { error: "Could not update the meeting link." };

  revalidatePath("/teacher/classrooms");
}

export async function enrollStudent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const studentId = formData.get("studentId");
  if (typeof classroomId !== "string" || typeof studentId !== "string" || !studentId) {
    return { error: "Select a student to enroll." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classroom_students").insert({
    classroom_id: classroomId,
    student_id: studentId,
  });

  if (error) return { error: "Could not enroll student — they may already be enrolled." };

  revalidatePath("/teacher/classrooms");
}

export async function unenrollStudent(formData: FormData): Promise<void> {
  const classroomId = formData.get("classroomId");
  const studentId = formData.get("studentId");
  if (typeof classroomId !== "string" || typeof studentId !== "string") return;

  const supabase = await createClient();
  await supabase.from("classroom_students").delete().eq("classroom_id", classroomId).eq("student_id", studentId);

  revalidatePath("/teacher/classrooms");
}

// Lets a student who is blocked by missing homework (join_classroom()'s
// homework lock) into the class anyway, for a valid reason. One-time: the
// pass is used up the next time the student joins. RLS
// (lock_overrides_teacher_insert) limits it to the teacher's own classrooms.
export async function grantClassAccess(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const studentId = formData.get("studentId");
  const reason = formData.get("reason");
  if (typeof classroomId !== "string" || typeof studentId !== "string") return { error: "Invalid request." };
  if (typeof reason !== "string" || !reason.trim()) return { error: "Write the reason for letting them in." };
  if (reason.trim().length > 500) return { error: "Keep the reason under 500 characters." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("homework_lock_overrides")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("student_id", studentId)
    .limit(1);
  if (existing && existing.length > 0) return { error: "This student already has an unused pass for this class." };

  const { error } = await supabase.from("homework_lock_overrides").insert({
    classroom_id: classroomId,
    student_id: studentId,
    granted_by: profile.id,
    reason: reason.trim(),
  });
  if (error) return { error: "Could not grant access." };

  revalidatePath("/teacher/classrooms");
}
