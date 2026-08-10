"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function createClassroom(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get("name");
  const levelId = formData.get("levelId");
  const meetingLink = formData.get("meetingLink");

  if (typeof name !== "string" || !name.trim()) return { error: "Enter a classroom name." };
  if (typeof levelId !== "string" || !levelId) return { error: "Select a level." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { error } = await supabase.from("classrooms").insert({
    teacher_id: profile.id,
    name: name.trim(),
    level_id: levelId,
    meeting_link: typeof meetingLink === "string" && meetingLink.trim() ? meetingLink.trim() : null,
  });

  if (error) return { error: "Could not create classroom." };

  revalidatePath("/teacher/classrooms");
}

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
