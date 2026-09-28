"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setAttendance(
  classroomId: string,
  studentId: string,
  date: string,
  present: boolean
): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_attendance", {
    p_classroom_id: classroomId,
    p_student_id: studentId,
    p_date: date,
    p_present: present,
  });
  if (error) return { error: "Could not update attendance." };
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
  return {};
}
