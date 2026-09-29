"use server";

import { revalidatePath } from "next/cache";
import type { DeleteResult } from "@/components/common/confirm-delete-button";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently deletes a teacher. Refuses while they still lead a classroom —
// classrooms cascade from their teacher, so deleting would wipe the whole
// class (enrollments, homework, submissions, grades). Once reassigned, their
// past homework is handed to each classroom's current teacher so students
// keep their submissions and grades; progress reports are kept (0044).
export async function deleteTeacher(teacherId: string): Promise<DeleteResult> {
  const caller = await getCurrentProfile();
  if (!caller || caller.role !== "admin" || caller.status !== "active") {
    return { ok: false, error: "Only admins can delete teachers." };
  }

  const admin = createAdminClient();
  const { data: teacher } = await admin.from("profiles").select("id, role").eq("id", teacherId).maybeSingle();
  if (!teacher || teacher.role !== "teacher") return { ok: false, error: "Teacher not found." };

  const { data: leading } = await admin.from("classrooms").select("name").eq("teacher_id", teacherId);
  if (leading && leading.length > 0) {
    return {
      ok: false,
      error: `Assign a new teacher to ${leading.map((c) => c.name).join(", ")} first (Admin → Classrooms).`,
    };
  }

  const { data: homework } = await admin.from("homework").select("id, classroom_id").eq("teacher_id", teacherId);
  if (homework && homework.length > 0) {
    const classroomIds = [...new Set(homework.map((h) => h.classroom_id))];
    const { data: classrooms } = await admin.from("classrooms").select("id, teacher_id").in("id", classroomIds);
    for (const c of classrooms ?? []) {
      const { error } = await admin
        .from("homework")
        .update({ teacher_id: c.teacher_id })
        .eq("teacher_id", teacherId)
        .eq("classroom_id", c.id);
      if (error) return { ok: false, error: "Could not hand their homework to the new teacher. Please try again." };
    }
  }

  const { data: files } = await admin.storage.from("admission-documents").list(teacherId);
  if (files && files.length > 0) {
    await admin.storage.from("admission-documents").remove(files.map((f) => `${teacherId}/${f.name}`));
  }

  const { error } = await admin.auth.admin.deleteUser(teacherId);
  if (error) {
    console.error("[delete-teacher] deleteUser failed:", error);
    return { ok: false, error: "Could not delete this teacher. Please try again." };
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  return { ok: true };
}
