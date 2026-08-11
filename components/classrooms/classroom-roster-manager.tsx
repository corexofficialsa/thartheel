import { X } from "lucide-react";
import { AssignTeacherForm } from "@/components/classrooms/assign-teacher-form";
import { CreateClassroomForm } from "@/components/classrooms/create-classroom-form";
import { EnrollStudentForm } from "@/components/classrooms/enroll-student-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { unenrollStudentFromClassroom } from "@/lib/classrooms/actions";
import { createClient } from "@/lib/supabase/server";

export async function ClassroomRosterManager() {
  const supabase = await createClient();

  const [{ data: classrooms }, { data: levels }, { data: teachers }, { data: allTeachers }, { data: activeStudents }] =
    await Promise.all([
      supabase.from("classrooms").select("id, name, teacher_id, level_id, created_at").order("created_at", { ascending: false }),
      supabase.from("levels").select("id, name"),
      supabase.from("profiles").select("id, name").eq("role", "teacher").eq("status", "active"),
      // Broader than `teachers` (active-only, used for assignment options)
      // so a classroom whose teacher was later removed still shows a real
      // name here instead of "—".
      supabase.from("profiles").select("id, name").eq("role", "teacher"),
      supabase.from("profiles").select("id, name, email").eq("role", "student").eq("status", "active"),
    ]);

  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const { data: enrollments } =
    classroomIds.length > 0
      ? await supabase.from("classroom_students").select("classroom_id, student_id").in("classroom_id", classroomIds)
      : { data: [] as { classroom_id: string; student_id: string }[] };

  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));
  const teacherNameById = new Map((allTeachers ?? []).map((t) => [t.id, t.name]));
  const studentById = new Map((activeStudents ?? []).map((s) => [s.id, s]));
  const enrolledByClassroom = new Map<string, string[]>();
  for (const row of enrollments ?? []) {
    const list = enrolledByClassroom.get(row.classroom_id) ?? [];
    list.push(row.student_id);
    enrolledByClassroom.set(row.classroom_id, list);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New classroom</CardTitle>
          <CardDescription>Create a classroom and assign a teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateClassroomForm levels={levels ?? []} teachers={teachers ?? []} />
        </CardContent>
      </Card>

      {(classrooms ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No classrooms yet.</p>
      )}

      {(classrooms ?? []).map((classroom) => {
        const enrolledIds = enrolledByClassroom.get(classroom.id) ?? [];
        const enrolledStudents = enrolledIds.map((id) => studentById.get(id)).filter(Boolean) as {
          id: string;
          name: string;
          email: string;
        }[];
        const availableStudents = (activeStudents ?? []).filter((s) => !enrolledIds.includes(s.id));

        return (
          <Card key={classroom.id}>
            <CardHeader>
              <CardTitle>{classroom.name}</CardTitle>
              <CardDescription>{levelNameById.get(classroom.level_id ?? "") ?? "No level"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium">
                  Teacher: {teacherNameById.get(classroom.teacher_id) ?? "—"}
                </p>
                <AssignTeacherForm
                  classroomId={classroom.id}
                  currentTeacherId={classroom.teacher_id}
                  teachers={teachers ?? []}
                />
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">Enrolled students ({enrolledStudents.length})</p>
                {enrolledStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {enrolledStudents.map((student) => (
                      <li key={student.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                        <span>
                          {student.name} <span className="text-muted-foreground">({student.email})</span>
                        </span>
                        <form action={unenrollStudentFromClassroom}>
                          <input type="hidden" name="classroomId" value={classroom.id} />
                          <input type="hidden" name="studentId" value={student.id} />
                          <Button type="submit" size="icon-sm" variant="ghost">
                            <X className="size-4" />
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <EnrollStudentForm classroomId={classroom.id} availableStudents={availableStudents} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
