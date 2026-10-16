import { getCurrentProfile } from "@/lib/auth/session";
import { SKILL_LABEL, timeSlotLabel } from "@/lib/registration/student-options";
import { createClient } from "@/lib/supabase/server";

// CSV of every student (active and pending) for admins. Opens directly in
// Excel / Google Sheets: UTF-8 BOM so Arabic and Malayalam survive, and any
// cell starting with = + - @ is prefixed with ' so it can't run as a
// spreadsheet formula (CSV injection).
function cell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const [{ data: students }, { data: levels }, { data: enrollments }, { data: classrooms }, { data: invoices }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, name, email, phone, whatsapp_number, gender, age, place, address, level_id, status, makharij_level, qaida_level, tajweed_level, preferred_time_slot, utm_source, utm_medium, utm_campaign, created_at"
        )
        .eq("role", "student")
        .order("name"),
      supabase.from("levels").select("id, name"),
      supabase.from("classroom_students").select("student_id, classroom_id"),
      supabase.from("classrooms").select("id, name"),
      supabase.from("fee_invoices").select("student_id, amount, amount_paid, status").eq("period", "registration"),
    ]);

  const levelName = new Map((levels ?? []).map((l) => [l.id, l.name]));
  const classroomName = new Map((classrooms ?? []).map((c) => [c.id, c.name]));
  const classroomsByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = classroomsByStudent.get(e.student_id) ?? [];
    list.push(classroomName.get(e.classroom_id) ?? "");
    classroomsByStudent.set(e.student_id, list);
  }
  const invoiceByStudent = new Map((invoices ?? []).map((i) => [i.student_id, i]));

  const header = [
    "Name", "Email", "Phone", "WhatsApp", "Gender", "Age", "Country & city", "Address", "Level", "Status",
    "Classroom", "Makharij", "Qaida Madaniyya", "Tajweed", "Preferred time", "Registration fee (SAR)",
    "Fee paid (SAR)", "Fee status", "Registered on", "Source", "Medium", "Campaign",
  ];
  const rows = (students ?? []).map((s) => {
    const inv = invoiceByStudent.get(s.id);
    return [
      s.name, s.email, s.phone, s.whatsapp_number, s.gender ?? "", s.age ?? "", s.place ?? "", s.address ?? "",
      (s.level_id && levelName.get(s.level_id)) ?? "", s.status, (classroomsByStudent.get(s.id) ?? []).join("; "),
      s.makharij_level ? SKILL_LABEL[s.makharij_level] : "", s.qaida_level ? SKILL_LABEL[s.qaida_level] : "",
      s.tajweed_level ? SKILL_LABEL[s.tajweed_level] : "", s.preferred_time_slot ? timeSlotLabel(s.preferred_time_slot) : "",
      inv?.amount ?? "", inv?.amount_paid ?? "", inv?.status ?? "",
      new Date(s.created_at).toISOString().slice(0, 10),
      s.utm_source ?? "", s.utm_medium ?? "", s.utm_campaign ?? "",
    ];
  });

  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mirqath-students-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
