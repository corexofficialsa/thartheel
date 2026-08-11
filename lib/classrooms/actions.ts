"use server";

import { revalidatePath } from "next/cache";
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
