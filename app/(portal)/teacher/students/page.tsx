import type { Metadata } from "next";
import { StudentProgressTable } from "@/components/students/student-progress-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/page-header";
import { QueryNotice, readQuery } from "@/components/portal/query-notice";

export const metadata: Metadata = { title: "Students" };

export default async function TeacherStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = readQuery((await searchParams).q);
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase.from("classrooms").select("id").eq("teacher_id", profile.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const { data: enrollments } =
    classroomIds.length > 0
      ? await supabase.from("classroom_students").select("student_id").in("classroom_id", classroomIds)
      : { data: [] as { student_id: string }[] };
  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Students in your classrooms, with their phase, attendance, and grades." />
      {q && <QueryNotice q={q} clearHref="/teacher/students"/>}
      <Card>
        <CardHeader>
          <CardTitle>Student progress</CardTitle>
          <CardDescription>{studentIds.length} students</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentProgressTable studentIds={studentIds} query={q} />
        </CardContent>
      </Card>
    </div>
  );
}
