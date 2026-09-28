import { BookOpen, DollarSign, GraduationCap, Users } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/page-header";

export default async function BoardHomePage() {
  await requireRole("board");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: teacherCount }, { count: studentCount }, { count: classroomCount }, { data: records }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "active"),
    supabase.from("classrooms").select("id", { count: "exact", head: true }),
    supabase.from("finance_records").select("type, amount").gte("date", startOfMonth.toISOString().slice(0, 10)),
  ]);

  const income = (records ?? []).filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const expense = (records ?? []).filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Board overview" description="A brief on everything happening across the academy." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Active teachers" value={teacherCount ?? 0} href="/board/teachers" />
        <StatCard icon={GraduationCap} label="Active students" value={studentCount ?? 0} href="/board/students" />
        <StatCard icon={BookOpen} label="Classrooms" value={classroomCount ?? 0} href="/board/classrooms" />
        <StatCard
          icon={DollarSign}
          label="Net finance this month"
          value={`${(income - expense).toFixed(0)} SAR`}
          href="/board/finance"
        />
      </div>
    </div>
  );
}
