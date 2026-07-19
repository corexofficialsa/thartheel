"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function recordMilestone(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = formData.get("studentId");
  const trackId = formData.get("trackId");
  const milestoneIndex = formData.get("milestoneIndex");

  if (typeof studentId !== "string" || !studentId) return { error: "Select a student." };
  if (typeof trackId !== "string" || !trackId) return { error: "Select a track." };
  const index = Number(milestoneIndex);
  if (!Number.isInteger(index) || index < 1) return { error: "Enter a valid milestone number." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("student_milestones")
    .upsert(
      { student_id: studentId, track_id: trackId, milestone_index: index, recorded_by: user.id },
      { onConflict: "student_id,track_id,milestone_index" }
    );

  if (error) return { error: "Could not record milestone." };

  revalidatePath("/teacher/academics");
}

export async function createProgressReport(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = formData.get("studentId");
  const period = formData.get("period");
  const notes = formData.get("notes");

  if (typeof studentId !== "string" || !studentId) return { error: "Select a student." };
  if (typeof period !== "string" || !["daily", "weekly", "monthly"].includes(period)) {
    return { error: "Select a period." };
  }
  if (typeof notes !== "string" || !notes.trim()) return { error: "Enter your notes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("progress_reports").insert({
    student_id: studentId,
    teacher_id: user.id,
    period: period as "daily" | "weekly" | "monthly",
    notes: notes.trim(),
  });

  if (error) return { error: "Could not save progress report." };

  revalidatePath("/teacher/academics");
}

export async function createExam(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classroomId = formData.get("classroomId");
  const title = formData.get("title");
  const examType = formData.get("examType");
  const scheduledAt = formData.get("scheduledAt");

  if (typeof classroomId !== "string" || !classroomId) return { error: "Select a classroom." };
  if (typeof title !== "string" || !title.trim()) return { error: "Enter a title." };
  if (typeof examType !== "string" || !examType.trim()) return { error: "Enter an exam type." };
  if (typeof scheduledAt !== "string" || !scheduledAt) return { error: "Set a date." };

  const supabase = await createClient();
  const { error } = await supabase.from("exams").insert({
    classroom_id: classroomId,
    title: title.trim(),
    exam_type: examType.trim(),
    scheduled_at: new Date(scheduledAt).toISOString(),
  });

  if (error) return { error: "Could not create exam." };

  revalidatePath("/teacher/academics");
}

export async function publishResult(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const examId = formData.get("examId");
  const studentId = formData.get("studentId");
  const marks = formData.get("marks");

  if (typeof examId !== "string" || !examId) return { error: "Invalid exam." };
  if (typeof studentId !== "string" || !studentId) return { error: "Select a student." };
  const marksValue = Number(marks);
  if (Number.isNaN(marksValue)) return { error: "Enter valid marks." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_results")
    .upsert(
      { exam_id: examId, student_id: studentId, marks: marksValue, published_at: new Date().toISOString() },
      { onConflict: "exam_id,student_id" }
    );

  if (error) return { error: "Could not publish result." };

  revalidatePath("/teacher/academics");
}

export async function uploadTeachingNote(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get("title");
  const levelId = formData.get("levelId");
  const file = formData.get("file");

  if (typeof title !== "string" || !title.trim()) return { error: "Enter a title." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const path = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("teaching-notes")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: "Could not upload file." };

  const { error } = await supabase.from("teaching_notes").insert({
    title: title.trim(),
    file_url: path,
    level_id: typeof levelId === "string" && levelId ? levelId : null,
    uploaded_by: user.id,
  });

  if (error) return { error: "Could not save note metadata." };

  revalidatePath("/teacher/academics");
}
