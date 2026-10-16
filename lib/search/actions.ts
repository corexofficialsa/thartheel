"use server";

import { getCurrentProfile } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type SearchResult = { type: "Student" | "Teacher" | "Classroom" | "Homework"; label: string; sublabel?: string; href: string };

// Escapes LIKE wildcards so the query is matched literally (the value itself
// is sent as a bound parameter by supabase-js — no injection either way).
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const enc = encodeURIComponent;

// Portal-wide search for people, classrooms and homework, scoped to what
// the caller's role may see. Reads run through the caller's RLS-bound
// client, and teachers/students are additionally limited to their own
// classrooms explicitly.
export async function searchPortal(rawQuery: string): Promise<SearchResult[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") return [];
  const q = rawQuery.trim().slice(0, 60);
  if (q.length < 2) return [];
  if (!(await rateLimit(`search:${profile.id}`, 60, 60))) return [];

  const supabase = await createClient();
  const pattern = like(q);
  const results: SearchResult[] = [];

  if (profile.role === "admin" || profile.role === "board" || profile.role === "finance") {
    const base = `/${profile.role}`;
    const { data: students } = await supabase
      .from("profiles")
      .select("id, name, email, status")
      .eq("role", "student")
      .ilike("name", pattern)
      .order("name")
      .limit(6);
    for (const s of students ?? []) {
      results.push({
        type: "Student",
        label: s.name,
        sublabel: s.status === "active" ? s.email : `${s.email} · ${s.status}`,
        href: profile.role === "finance" ? "/finance/ledger" : `${base}/students?q=${enc(s.name)}`,
      });
    }
    if (profile.role !== "finance") {
      const [{ data: teachers }, { data: classrooms }] = await Promise.all([
        supabase.from("profiles").select("id, name, email").eq("role", "teacher").ilike("name", pattern).order("name").limit(6),
        supabase.from("classrooms").select("id, name").ilike("name", pattern).order("name").limit(6),
      ]);
      for (const t of teachers ?? []) {
        results.push({
          type: "Teacher",
          label: t.name,
          sublabel: t.email,
          href: profile.role === "board" ? `/board/teachers/${t.id}` : `/admin/teachers?q=${enc(t.name)}`,
        });
      }
      for (const c of classrooms ?? []) results.push({ type: "Classroom", label: c.name, href: `${base}/classrooms` });
    }
  } else if (profile.role === "teacher") {
    const { data: classrooms } = await supabase.from("classrooms").select("id, name").eq("teacher_id", profile.id);
    const ids = (classrooms ?? []).map((c) => c.id);
    for (const c of (classrooms ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)) {
      results.push({ type: "Classroom", label: c.name, href: "/teacher/classrooms" });
    }
    if (ids.length > 0) {
      const { data: enrolled } = await supabase.from("classroom_students").select("student_id").in("classroom_id", ids);
      const studentIds = [...new Set((enrolled ?? []).map((e) => e.student_id))];
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", studentIds)
          .ilike("name", pattern)
          .order("name")
          .limit(6);
        for (const s of students ?? []) results.push({ type: "Student", label: s.name, href: `/teacher/students?q=${enc(s.name)}` });
      }
      const { data: homework } = await supabase
        .from("homework")
        .select("id, title")
        .in("classroom_id", ids)
        .ilike("title", pattern)
        .limit(6);
      for (const h of homework ?? []) results.push({ type: "Homework", label: h.title, href: "/teacher/homework" });
    }
  } else if (profile.role === "student") {
    const { data: enrolled } = await supabase.from("classroom_students").select("classroom_id").eq("student_id", profile.id);
    const ids = (enrolled ?? []).map((e) => e.classroom_id);
    if (ids.length > 0) {
      const [{ data: classrooms }, { data: homework }] = await Promise.all([
        supabase.from("classrooms").select("id, name").in("id", ids).ilike("name", pattern).limit(6),
        supabase.from("homework").select("id, title").in("classroom_id", ids).ilike("title", pattern).limit(6),
      ]);
      for (const c of classrooms ?? []) results.push({ type: "Classroom", label: c.name, href: "/student/classrooms" });
      for (const h of homework ?? []) results.push({ type: "Homework", label: h.title, href: "/student/homework" });
    }
  }
  return results;
}
