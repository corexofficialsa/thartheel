"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteStudentResult = { ok: true } | { ok: false; error: string };

// Buckets whose objects live under "<studentId>/..." — storage doesn't
// cascade with the database, so these are cleared explicitly.
const STUDENT_BUCKETS = ["homework-submissions", "registration-recitations", "admission-documents"];

// Permanently deletes a student: their auth user, profile, and everything
// that cascades from it (enrollments, attendance, homework, grades, exam
// results, invoices, messages, notifications). Finance ledger entries are
// kept — they only mention the student by name.
export async function deleteStudent(studentId: string): Promise<DeleteStudentResult> {
  const caller = await getCurrentProfile();
  if (!caller || caller.role !== "admin" || caller.status !== "active") {
    return { ok: false, error: "Only admins can delete students." };
  }

  const admin = createAdminClient();
  const { data: student } = await admin.from("profiles").select("id, role").eq("id", studentId).maybeSingle();
  if (!student || student.role !== "student") return { ok: false, error: "Student not found." };

  for (const bucket of STUDENT_BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(studentId, { limit: 1000 });
    if (files && files.length > 0) {
      await admin.storage.from(bucket).remove(files.map((f) => `${studentId}/${f.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) {
    console.error("[delete-student] deleteUser failed:", error);
    return { ok: false, error: "Could not delete this student. Please try again." };
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { ok: true };
}
