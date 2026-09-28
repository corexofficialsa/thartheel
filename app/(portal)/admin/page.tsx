import { BookOpen, GraduationCap, UserCog, UserPlus, Users } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [
    { count: studentCount },
    { count: teacherCount },
    { count: classroomCount },
    { count: pendingStudents },
    { count: pendingTeachers },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "active"),
    supabase.from("classrooms").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "pending"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Overview</h1>
        <p className="text-muted-foreground">Students, teachers, classrooms, and registrations at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={GraduationCap} label="Students" value={studentCount ?? 0} href="/admin/students" />
        <StatCard icon={Users} label="Teachers" value={teacherCount ?? 0} href="/admin/teachers" />
        <StatCard icon={BookOpen} label="Classrooms" value={classroomCount ?? 0} href="/admin/classrooms" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={UserPlus}
          label="Pending student registrations"
          value={pendingStudents ?? 0}
          href="/admin/registrations/student"
        />
        <StatCard
          icon={UserCog}
          label="Pending teacher registrations"
          value={pendingTeachers ?? 0}
          href="/admin/registrations/teacher"
        />
      </div>
    </div>
  );
}
