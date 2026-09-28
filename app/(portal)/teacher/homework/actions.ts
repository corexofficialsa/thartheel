"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { parseAllowedModes } from "@/lib/homework/modes";
import { notify } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function createHomework(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const title = formData.get("title");
  const description = formData.get("description");
  const dueDate = formData.get("dueDate");

  if (typeof classroomId !== "string" || !classroomId) return { error: "Select a classroom." };
  if (typeof title !== "string" || !title.trim()) return { error: "Enter a title." };
  if (typeof dueDate !== "string" || !dueDate) return { error: "Set a due date." };
  const allowedModes = parseAllowedModes(formData);
  if (allowedModes.length === 0) return { error: "Pick at least one accepted answer type." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { data: homework, error } = await supabase
    .from("homework")
    .insert({
      classroom_id: classroomId,
      teacher_id: profile.id,
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      due_date: new Date(dueDate).toISOString(),
      allowed_modes: allowedModes,
    })
    .select("id")
    .single();

  if (error || !homework) return { error: "Could not create homework." };

  const [{ data: classroom }, { data: enrollments }] = await Promise.all([
    supabase.from("classrooms").select("name").eq("id", classroomId).single(),
    supabase.from("classroom_students").select("student_id").eq("classroom_id", classroomId),
  ]);

  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  if (studentIds.length > 0) {
    const { data: students } = await supabase.from("profiles").select("name, whatsapp_number").in("id", studentIds);
    await Promise.all(
      (students ?? [])
        .filter((s) => s.whatsapp_number)
        .map((s) =>
          notify("whatsapp", s.whatsapp_number as string, "homework_posted", {
            name: s.name,
            classroomName: classroom?.name ?? "your classroom",
            title: title.trim(),
            dueDate: new Date(dueDate).toLocaleDateString(),
          })
        )
    );
  }

  revalidatePath("/teacher/homework");
}

export async function gradeSubmission(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const submissionId = formData.get("submissionId");
  const grade = formData.get("grade");
  const feedback = formData.get("feedback");

  if (typeof submissionId !== "string") return { error: "Invalid request." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { error } = await supabase.from("homework_grades").upsert(
    {
      submission_id: submissionId,
      grade: typeof grade === "string" && grade.trim() ? Number(grade) : null,
      feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : null,
      graded_by: profile.id,
    },
    { onConflict: "submission_id" }
  );

  if (error) return { error: "Could not save grade." };

  revalidatePath("/teacher/homework");
}

// RLS (homework_teacher_write) limits these to the teacher's own homework.
export async function updateHomework(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const homeworkId = formData.get("homeworkId");
  const title = formData.get("title");
  const description = formData.get("description");
  const dueDate = formData.get("dueDate");
  const allowedModes = parseAllowedModes(formData);

  if (typeof homeworkId !== "string" || !homeworkId) return { error: "Invalid homework." };
  if (typeof title !== "string" || !title.trim()) return { error: "Enter a title." };
  if (typeof dueDate !== "string" || !dueDate) return { error: "Set a due date." };
  if (allowedModes.length === 0) return { error: "Pick at least one accepted answer type." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("homework")
    .update({
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      due_date: new Date(dueDate).toISOString(),
      allowed_modes: allowedModes,
    })
    .eq("id", homeworkId);
  if (error) return { error: "Could not update homework." };

  revalidatePath("/teacher/homework");
  revalidatePath("/student/homework");
}

export async function deleteHomework(formData: FormData): Promise<void> {
  const homeworkId = formData.get("homeworkId");
  if (typeof homeworkId !== "string") return;
  const supabase = await createClient();
  await supabase.from("homework").delete().eq("id", homeworkId);
  revalidatePath("/teacher/homework");
  revalidatePath("/student/homework");
}

// One-time: lifts the past-due and already-graded blocks for this student's
// next save only (consumed by the submission trigger).
export async function allowResubmission(formData: FormData): Promise<void> {
  const homeworkId = formData.get("homeworkId");
  const studentId = formData.get("studentId");
  if (typeof homeworkId !== "string" || typeof studentId !== "string") return;
  const profile = await getCurrentProfile();
  if (!profile) return;
  const supabase = await createClient();
  await supabase
    .from("homework_resubmit_grants")
    .upsert({ homework_id: homeworkId, student_id: studentId, granted_by: profile.id }, { onConflict: "homework_id,student_id" });
  revalidatePath("/teacher/homework");
  revalidatePath("/student/homework");
}
