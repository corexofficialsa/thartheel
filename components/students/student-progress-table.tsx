import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { DeleteStudentButton } from "./delete-student-button";

// Shared by the admin Students page (every active student) and the teacher
// Students page (students enrolled in that teacher's classrooms). RLS scopes
// what each caller can read; the caller decides which students to show.
export async function StudentProgressTable({
  studentIds,
  deletable = false,
}: {
  studentIds: string[];
  // Admin only: adds a delete button per student.
  deletable?: boolean;
}) {
  if (studentIds.length === 0) {
    return <p className="text-sm text-muted-foreground">No students yet.</p>;
  }

  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: students },
    { data: levels },
    { data: tracks },
    { data: phases },
    { data: attendance },
    { data: enrollments },
    { data: submissions },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, email, level_id").in("id", studentIds).order("name"),
    supabase.from("levels").select("id, name"),
    supabase.from("syllabus_tracks").select("id, name, total_milestones"),
    supabase.from("student_milestones").select("student_id, track_id, milestone_index").in("student_id", studentIds),
    supabase
      .from("attendance")
      .select("user_id")
      .in("user_id", studentIds)
      .gte("date", thirtyDaysAgo.toISOString().slice(0, 10)),
    supabase.from("classroom_students").select("student_id, classroom_id").in("student_id", studentIds),
    supabase.from("homework_submissions").select("id, student_id").in("student_id", studentIds),
  ]);

  const classroomIds = [...new Set((enrollments ?? []).map((e) => e.classroom_id))];
  const submissionIds = (submissions ?? []).map((s) => s.id);
  const [{ data: classrooms }, { data: grades }] = await Promise.all([
    classroomIds.length > 0
      ? supabase.from("classrooms").select("id, name").in("id", classroomIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    submissionIds.length > 0
      ? supabase.from("homework_grades").select("submission_id, grade").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] as { submission_id: string; grade: number | null }[] }),
  ]);

  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));
  const trackByName = new Map((tracks ?? []).map((t) => [t.name, t]));
  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));

  const phaseByStudentTrack = new Map<string, number>();
  for (const p of phases ?? []) {
    const key = `${p.student_id}:${p.track_id}`;
    phaseByStudentTrack.set(key, Math.max(phaseByStudentTrack.get(key) ?? 0, p.milestone_index));
  }

  const attendanceByStudent = new Map<string, number>();
  for (const row of attendance ?? []) {
    attendanceByStudent.set(row.user_id, (attendanceByStudent.get(row.user_id) ?? 0) + 1);
  }

  const classroomsByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = classroomsByStudent.get(e.student_id) ?? [];
    list.push(classroomNameById.get(e.classroom_id) ?? "—");
    classroomsByStudent.set(e.student_id, list);
  }

  const studentBySubmission = new Map((submissions ?? []).map((s) => [s.id, s.student_id]));
  const gradeTotals = new Map<string, { sum: number; count: number }>();
  for (const g of grades ?? []) {
    if (g.grade === null) continue;
    const studentId = studentBySubmission.get(g.submission_id);
    if (!studentId) continue;
    const total = gradeTotals.get(studentId) ?? { sum: 0, count: 0 };
    gradeTotals.set(studentId, { sum: total.sum + Number(g.grade), count: total.count + 1 });
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Classroom</TableHead>
            <TableHead className="min-w-40">Phase</TableHead>
            <TableHead>Attendance (30d)</TableHead>
            <TableHead className="text-right">Avg grade</TableHead>
            {deletable && <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(students ?? []).map((student) => {
            const levelName = student.level_id ? levelNameById.get(student.level_id) : undefined;
            const track = levelName ? trackByName.get(levelName) : undefined;
            const phase = track ? (phaseByStudentTrack.get(`${student.id}:${track.id}`) ?? 0) : 0;
            const grade = gradeTotals.get(student.id);
            return (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs text-muted-foreground">{student.email}</div>
                </TableCell>
                <TableCell>{levelName ?? "—"}</TableCell>
                <TableCell>{classroomsByStudent.get(student.id)?.join(", ") ?? "—"}</TableCell>
                <TableCell>
                  {track ? (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Phase {phase} of {track.total_milestones}
                      </div>
                      <Progress value={(phase / track.total_milestones) * 100} />
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{attendanceByStudent.get(student.id) ?? 0}</TableCell>
                <TableCell className="text-right">{grade ? (grade.sum / grade.count).toFixed(1) : "—"}</TableCell>
                {deletable && (
                  <TableCell className="text-right">
                    <DeleteStudentButton studentId={student.id} name={student.name} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
