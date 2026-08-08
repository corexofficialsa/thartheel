import { GraduationCap, LayoutDashboard, UserCog } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ count: pendingStudents }, { count: pendingTeachers }, { count: classroomCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "pending"),
    supabase.from("classrooms").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Overview</h1>
        <p className="text-muted-foreground">Recent registrations and academy activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={GraduationCap}
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
        <StatCard icon={LayoutDashboard} label="Active classrooms" value={classroomCount ?? 0} />
      </div>
    </div>
  );
}
