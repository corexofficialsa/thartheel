import { StudentProgressTable } from "@/components/students/student-progress-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherStudentsPage() {
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
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-muted-foreground">Students in your classrooms, with their phase, attendance, and grades.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student progress</CardTitle>
          <CardDescription>{studentIds.length} students</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentProgressTable studentIds={studentIds} />
        </CardContent>
      </Card>
    </div>
  );
}
