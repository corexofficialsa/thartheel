"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function uploadVisitReport(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get("title");
  const notes = formData.get("notes");
  const classroomId = formData.get("classroomId");
  const visitedAt = formData.get("visitedAt");
  const file = formData.get("file");

  if (typeof title !== "string" || !title.trim()) return { error: "Enter a title." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  let fileUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const path = `${user.id}/${Date.now()}-${file.name}`;
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
    created_by: user.id,
  });

  if (error) return { error: "Could not save visit report." };

  revalidatePath("/admin/visit-reports");
  revalidatePath("/board/visit-reports");
}
