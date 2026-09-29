"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DeleteResult } from "@/components/common/confirm-delete-button";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; success?: boolean } | undefined;

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

  if (error) {
    if (error.message.includes("past_due")) {
      return { error: "The due date has passed, so this homework is closed. Ask your teacher to allow a resubmission." };
    }
    if (error.message.includes("already_graded")) {
      return { error: "Your teacher has already graded this. Ask your teacher if you'd like to resubmit." };
    }
    if (error.message.includes("mode_not_allowed")) {
      return { error: "Your teacher didn't ask for that type of answer on this homework." };
    }
    return { error: "Could not submit your homework. Please try again." };
  }

  revalidatePath("/student/homework");
  return { success: true };
}

// Students can withdraw a submission while it's ungraded and before the due
// date (RLS homework_submissions_delete_own). Its recordings are removed from
// storage too — the paths come from the student's own deleted row.
export async function withdrawSubmission(homeworkId: string): Promise<DeleteResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .delete()
    .eq("homework_id", homeworkId)
    .eq("student_id", profile.id)
    .select("video_url, audio_url");
  if (error || !data?.length) {
    return { ok: false, error: "This submission can't be withdrawn (it's graded or past the due date)." };
  }
  const paths = [data[0].video_url, data[0].audio_url].filter((p): p is string => !!p);
  if (paths.length > 0) await createAdminClient().storage.from("homework-submissions").remove(paths);
  revalidatePath("/student/homework");
  return { ok: true };
}
