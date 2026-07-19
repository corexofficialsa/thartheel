import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherHomePage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase.from("classrooms").select("id").eq("teacher_id", profile.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: homeworkList }, { count: attendanceToday }] = await Promise.all([
    classroomIds.length > 0
      ? supabase.from("homework").select("id").in("classroom_id", classroomIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    classroomIds.length > 0
      ? supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .in("classroom_id", classroomIds)
          .eq("date", today)
      : Promise.resolve({ count: 0 }),
  ]);

  const homeworkIds = (homeworkList ?? []).map((h) => h.id);
  const { data: submissions } =
    homeworkIds.length > 0
      ? await supabase.from("homework_submissions").select("id").in("homework_id", homeworkIds)
      : { data: [] as { id: string }[] };
  const submissionIds = (submissions ?? []).map((s) => s.id);

  const { data: grades } =
    submissionIds.length > 0
      ? await supabase.from("homework_grades").select("submission_id").in("submission_id", submissionIds)
      : { data: [] as { submission_id: string }[] };
  const gradedIds = new Set((grades ?? []).map((g) => g.submission_id));
  const ungradedCount = submissionIds.filter((id) => !gradedIds.has(id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assalamu Alaikum, {profile.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Your classrooms and homework at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Classrooms</CardDescription>
            <CardTitle className="text-3xl">{classroomIds.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Submissions to grade</CardDescription>
            <CardTitle className="text-3xl">{ungradedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Attendance today</CardDescription>
            <CardTitle className="text-3xl">{attendanceToday ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
