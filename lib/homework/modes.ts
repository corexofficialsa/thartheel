import type { HomeworkMode } from "@/lib/supabase/types";

export function parseAllowedModes(formData: FormData): HomeworkMode[] {
  return formData
    .getAll("allowedModes")
    .filter((m): m is HomeworkMode => m === "text" || m === "audio" || m === "video");
}
