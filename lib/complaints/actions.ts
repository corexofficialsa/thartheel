"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string } | undefined;

export async function submitComplaint(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const subject = formData.get("subject");
  const description = formData.get("description");
  if (typeof subject !== "string" || !subject.trim()) return { error: "Enter a subject." };
  if (typeof description !== "string" || !description.trim()) return { error: "Describe the issue." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_complaint", {
    p_subject: subject.trim(),
    p_description: description.trim(),
  });
  if (error) return { error: "Could not submit your complaint. Please try again." };

  revalidatePath("/student/chat");
  revalidatePath("/teacher/chat");
  return { success: "Your complaint has been submitted to the academy admin." };
}

export type Complaint = {
  id: string;
  submitted_by_name: string;
  submitted_by_role: "student" | "teacher";
  subject: string;
  description: string;
  status: "open" | "in_review" | "resolved";
  resolution_note: string | null;
  created_at: string;
};

// Name reflects what RLS actually returns: a student/teacher only ever sees
// their own rows (complaints_select_own), admin/board see every row
// (complaints_select_staff) — same query, scope decided server-side.
export async function getVisibleComplaints(): Promise<Complaint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select("id, submitted_by_name, submitted_by_role, subject, description, status, resolution_note, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type UpdateComplaintState = { error?: string } | undefined;

export async function updateComplaintStatus(
  _prevState: UpdateComplaintState,
  formData: FormData
): Promise<UpdateComplaintState> {
  const complaintId = formData.get("complaintId");
  const status = formData.get("status");
  const resolutionNote = formData.get("resolutionNote");
  if (typeof complaintId !== "string" || !complaintId) return { error: "Invalid complaint." };
  if (status !== "open" && status !== "in_review" && status !== "resolved") return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("complaints")
    .update({
      status,
      resolution_note: typeof resolutionNote === "string" && resolutionNote.trim() ? resolutionNote.trim() : null,
      resolved_by: status === "resolved" ? user.id : null,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", complaintId);
  if (error) return { error: "Could not update this complaint." };

  revalidatePath("/admin/messages");
  revalidatePath("/board/messages");
}
