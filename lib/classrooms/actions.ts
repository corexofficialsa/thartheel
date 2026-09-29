"use server";

import { revalidatePath } from "next/cache";
import type { DeleteResult } from "@/components/common/confirm-delete-button";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Used by both admin and board classroom-management pages — RLS
// (classrooms_admin_write / classrooms_board_write, and the classroom_students
// equivalents) is what actually gates who can call these, not the code here.
function revalidateClassroomPaths() {
  revalidatePath("/admin/classrooms");
  revalidatePath("/board/classrooms");
}

export type ActionState = { error?: string } | undefined;

export async function createClassroom(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get("name");
  const teacherId = formData.get("teacherId");
  const levelId = formData.get("levelId");

  if (typeof name !== "string" || !name.trim()) return { error: "Enter a classroom name." };
  if (typeof teacherId !== "string" || !teacherId) return { error: "Select a teacher." };
  if (typeof levelId !== "string" || !levelId) return { error: "Select a level." };

  const supabase = await createClient();
  const { error } = await supabase.from("classrooms").insert({
    name: name.trim(),
    teacher_id: teacherId,
    level_id: levelId,
  });

  if (error) return { error: "Could not create classroom." };

  revalidateClassroomPaths();
}

export async function renameClassroom(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const name = formData.get("name");
  if (typeof classroomId !== "string" || !classroomId) return { error: "Invalid classroom." };
  if (typeof name !== "string" || !name.trim()) return { error: "Enter a classroom name." };

  const supabase = await createClient();
  const { error } = await supabase.from("classrooms").update({ name: name.trim() }).eq("id", classroomId);
  if (error) return { error: "Could not rename classroom." };

  revalidateClassroomPaths();
  revalidatePath("/teacher/classrooms");
}

export async function assignTeacher(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const teacherId = formData.get("teacherId");
  if (typeof classroomId !== "string" || !classroomId) return { error: "Invalid classroom." };
  if (typeof teacherId !== "string" || !teacherId) return { error: "Select a teacher." };

  const supabase = await createClient();
  const { error } = await supabase.from("classrooms").update({ teacher_id: teacherId }).eq("id", classroomId);

  if (error) return { error: "Could not reassign teacher." };

  revalidateClassroomPaths();
}

export async function enrollStudentInClassroom(_prevState: ActionState, formData: FormData): Promise<ActionState> {
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

  revalidateClassroomPaths();
}

export async function unenrollStudentFromClassroom(formData: FormData): Promise<void> {
  const classroomId = formData.get("classroomId");
  const studentId = formData.get("studentId");
  if (typeof classroomId !== "string" || typeof studentId !== "string") return;

  const supabase = await createClient();
  await supabase.from("classroom_students").delete().eq("classroom_id", classroomId).eq("student_id", studentId);

  revalidateClassroomPaths();
}

// Deletes a classroom and everything that belongs to it (enrollments,
// homework and submissions, attendance, exams, its group chat). Admin/board
// only — RLS would also let a teacher delete their own classroom, so the role
// is checked here explicitly. Submission recordings live in storage, which
// doesn't cascade, so they're removed first.
export async function deleteClassroom(classroomId: string): Promise<DeleteResult> {
  const caller = await getCurrentProfile();
  if (!caller || caller.status !== "active" || (caller.role !== "admin" && caller.role !== "board")) {
    return { ok: false, error: "Only admin or board can delete classrooms." };
  }

  const admin = createAdminClient();
  const { data: homework } = await admin.from("homework").select("id").eq("classroom_id", classroomId);
  const homeworkIds = (homework ?? []).map((h) => h.id);
  if (homeworkIds.length > 0) {
    const { data: submissions } = await admin
      .from("homework_submissions")
      .select("video_url, audio_url")
      .in("homework_id", homeworkIds);
    const paths = (submissions ?? []).flatMap((s) => [s.video_url, s.audio_url]).filter((p): p is string => !!p);
    if (paths.length > 0) await admin.storage.from("homework-submissions").remove(paths);
  }

  const { error } = await admin.from("classrooms").delete().eq("id", classroomId);
  if (error) return { ok: false, error: "Could not delete this classroom. Please try again." };

  revalidateClassroomPaths();
  return { ok: true };
}
