"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function uploadVisitReport(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get("title");
  const notes = formData.get("notes");
  const classroomId = formData.get("classroomId");
  const visitedAt = formData.get("visitedAt");
  const file = formData.get("file");

  if (typeof title !== "string" || !title.trim()) return { error: "Enter a title." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  let fileUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("halaqa-visit-reports").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) return { error: "Could not upload the report file." };
    fileUrl = path;
  }

  const { error } = await supabase.from("halaqa_visit_reports").insert({
    title: title.trim(),
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    classroom_id: typeof classroomId === "string" && classroomId ? classroomId : null,
    visited_at: typeof visitedAt === "string" && visitedAt ? visitedAt : new Date().toISOString().slice(0, 10),
    file_url: fileUrl,
    created_by: profile.id,
  });

  if (error) return { error: "Could not save visit report." };

  revalidatePath("/admin/visit-reports");
  revalidatePath("/board/visit-reports");
}
