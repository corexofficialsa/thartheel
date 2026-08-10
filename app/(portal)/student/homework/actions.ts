"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function submitHomework(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const homeworkId = formData.get("homeworkId");
  const textAnswer = formData.get("textAnswer");
  const videoPath = formData.get("videoPath");
  const audioPath = formData.get("audioPath");

  if (typeof homeworkId !== "string") return { error: "Invalid request." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { error } = await supabase.from("homework_submissions").upsert(
    {
      homework_id: homeworkId,
      student_id: profile.id,
      text_answer: typeof textAnswer === "string" && textAnswer.trim() ? textAnswer.trim() : null,
      video_url: typeof videoPath === "string" && videoPath ? videoPath : null,
      audio_url: typeof audioPath === "string" && audioPath ? audioPath : null,
    },
    { onConflict: "homework_id,student_id" }
  );

  if (error) return { error: "Could not submit your homework. Please try again." };

  revalidatePath("/student/homework");
}
