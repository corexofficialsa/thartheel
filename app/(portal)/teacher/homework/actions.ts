"use server";

import { revalidatePath } from "next/cache";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: homework, error } = await supabase
    .from("homework")
    .insert({
      classroom_id: classroomId,
      teacher_id: user.id,
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      due_date: new Date(dueDate).toISOString(),
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("homework_grades").upsert(
    {
      submission_id: submissionId,
      grade: typeof grade === "string" && grade.trim() ? Number(grade) : null,
      feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : null,
      graded_by: user.id,
    },
    { onConflict: "submission_id" }
  );

  if (error) return { error: "Could not save grade." };

  revalidatePath("/teacher/homework");
}
