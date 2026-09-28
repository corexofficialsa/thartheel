import { BookOpen, GraduationCap, UserCog, UserPlus, Users } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/page-header";

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
      <PageHeader title="Admin overview" description="Students, teachers, classrooms, and registrations at a glance." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={GraduationCap} label="Students" value={studentCount ?? 0} href="/admin/students" />
        <StatCard icon={Users} label="Teachers" value={teacherCount ?? 0} href="/admin/teachers" />
        <StatCard icon={BookOpen} label="Classrooms" value={classroomCount ?? 0} href="/admin/classrooms" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
