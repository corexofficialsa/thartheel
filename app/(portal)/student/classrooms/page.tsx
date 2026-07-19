import { JoinClassroomButton } from "@/components/classroom/join-classroom-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function StudentClassroomsPage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_id", profile.id);

  const classroomIds = (enrollments ?? []).map((e) => e.classroom_id);

  const { data: classrooms } =
    classroomIds.length > 0
      ? await supabase.from("classrooms").select("id, name, teacher_id, meeting_link").in("id", classroomIds)
      : { data: [] as { id: string; name: string; teacher_id: string; meeting_link: string | null }[] };

  const teacherIds = [...new Set((classrooms ?? []).map((c) => c.teacher_id))];
  const { data: teachers } =
    teacherIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", teacherIds)
      : { data: [] as { id: string; name: string }[] };
  const teacherNameById = new Map((teachers ?? []).map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classrooms</h1>
        <p className="text-muted-foreground">Join your class — attendance is recorded automatically.</p>
      </div>

      {(!classrooms || classrooms.length === 0) && (
        <p className="text-sm text-muted-foreground">
          You&apos;re not enrolled in any classroom yet. Your teacher or admin will add you once your batch is set up.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(classrooms ?? []).map((classroom) => (
          <Card key={classroom.id}>
            <CardHeader>
              <CardTitle>{classroom.name}</CardTitle>
              <CardDescription>Teacher: {teacherNameById.get(classroom.teacher_id) ?? "—"}</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinClassroomButton classroomId={classroom.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
