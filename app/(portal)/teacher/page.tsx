import Link from "next/link";
import { BookOpen, CalendarCheck, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { riyadhToday } from "@/lib/attendance/dates";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherHomePage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name")
    .eq("teacher_id", profile.id)
    .order("name");
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const today = riyadhToday();

  const [{ data: homeworkList }, { data: attendanceRows }, { data: enrollments }] = await Promise.all([
    classroomIds.length > 0
      ? supabase.from("homework").select("id").in("classroom_id", classroomIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    classroomIds.length > 0
      ? supabase
          .from("attendance")
          .select("classroom_id, user_id")
          .in("classroom_id", classroomIds)
          .eq("date", today)
          .eq("role", "student")
      : Promise.resolve({ data: [] as { classroom_id: string; user_id: string }[] }),
    classroomIds.length > 0
      ? supabase.from("classroom_students").select("classroom_id, student_id").in("classroom_id", classroomIds)
      : Promise.resolve({ data: [] as { classroom_id: string; student_id: string }[] }),
  ]);

  const homeworkIds = (homeworkList ?? []).map((h) => h.id);
  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
  const [{ data: submissions }, { data: students }] = await Promise.all([
    homeworkIds.length > 0
      ? supabase.from("homework_submissions").select("id").in("homework_id", homeworkIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    studentIds.length > 0
      ? supabase.from("profiles").select("id, name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: grades } =
    submissionIds.length > 0
      ? await supabase.from("homework_grades").select("submission_id").in("submission_id", submissionIds)
      : { data: [] as { submission_id: string }[] };
  const gradedIds = new Set((grades ?? []).map((g) => g.submission_id));
  const ungradedCount = submissionIds.filter((id) => !gradedIds.has(id)).length;

  const nameById = new Map((students ?? []).map((s) => [s.id, s.name]));
  const presentKeys = new Set((attendanceRows ?? []).map((r) => `${r.classroom_id}:${r.user_id}`));
  const perClassroom = (classrooms ?? []).map((c) => {
    const enrolled = (enrollments ?? []).filter((e) => e.classroom_id === c.id).map((e) => e.student_id);
    const present = enrolled.filter((id) => presentKeys.has(`${c.id}:${id}`));
    const absent = enrolled.filter((id) => !presentKeys.has(`${c.id}:${id}`));
    return { ...c, present, absent };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assalamu Alaikum, {profile.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Your classrooms, attendance, and homework at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={BookOpen} label="Classrooms" value={classroomIds.length} href="/teacher/classrooms" />
        <StatCard icon={ClipboardList} label="Submissions to grade" value={ungradedCount} href="/teacher/homework" />
        <StatCard
          icon={CalendarCheck}
          label="Attended today"
          value={(attendanceRows ?? []).length}
          href="/teacher/attendance"
        />
      </div>

      {perClassroom.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Today&apos;s attendance</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {perClassroom.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle>
                    <Link href={`/teacher/attendance?classroom=${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {c.present.length} attended · {c.absent.length} not attended
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                      Attended
                    </p>
                    {c.present.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No one yet</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {c.present.map((id) => (
                          <li key={id}>{nameById.get(id) ?? "Student"}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-destructive uppercase">Not attended</p>
                    {c.absent.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Everyone&apos;s here</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {c.absent.map((id) => (
                          <li key={id}>{nameById.get(id) ?? "Student"}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
