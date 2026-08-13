import { X } from "lucide-react";
import { JoinClassroomButton } from "@/components/classroom/join-classroom-button";
import { ClassroomLockToggle } from "@/components/teacher/classroom-lock-toggle";
import { CreateClassroomForm } from "@/components/teacher/create-classroom-form";
import { EnrollStudentForm } from "@/components/teacher/enroll-student-form";
import { MeetingLinkForm } from "@/components/teacher/meeting-link-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { unenrollStudent } from "./actions";

export default async function TeacherClassroomsPage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const [{ data: classrooms }, { data: levels }, { data: activeStudents }] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, name, level_id, meeting_link, teacher_joined_at, join_locked_override, created_at")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase.from("levels").select("id, name"),
    supabase.from("profiles").select("id, name, email").eq("role", "student").eq("status", "active"),
  ]);

  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const { data: enrollments } =
    classroomIds.length > 0
      ? await supabase.from("classroom_students").select("classroom_id, student_id").in("classroom_id", classroomIds)
      : { data: [] as { classroom_id: string; student_id: string }[] };

  // Mirrors the auto-lock rule evaluated server-side in join_classroom() —
  // this is just for display, the RPC is the actual source of truth at
  // the moment a student clicks join.
  function isEffectivelyLocked(classroom: { teacher_joined_at: string | null; join_locked_override: boolean | null }) {
    if (classroom.join_locked_override !== null) return classroom.join_locked_override;
    if (!classroom.teacher_joined_at) return false;
    const joinedAt = new Date(classroom.teacher_joined_at);
    if (joinedAt.toDateString() !== new Date().toDateString()) return false;
    return Date.now() - joinedAt.getTime() > 20 * 60 * 1000;
  }

  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));
  const studentById = new Map((activeStudents ?? []).map((s) => [s.id, s]));
  const enrolledByClassroom = new Map<string, string[]>();
  for (const row of enrollments ?? []) {
    const list = enrolledByClassroom.get(row.classroom_id) ?? [];
    list.push(row.student_id);
    enrolledByClassroom.set(row.classroom_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classrooms</h1>
        <p className="text-muted-foreground">Manage your classrooms, meeting links, and enrolled students.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New classroom</CardTitle>
          <CardDescription>Create a classroom for one of your levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateClassroomForm levels={levels ?? []} />
        </CardContent>
      </Card>

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
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{classroom.name}</CardTitle>
                <CardDescription>{levelNameById.get(classroom.level_id ?? "") ?? "No level"}</CardDescription>
              </div>
              <JoinClassroomButton classroomId={classroom.id} label="Join Class" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium">Meeting link</p>
                <MeetingLinkForm classroomId={classroom.id} meetingLink={classroom.meeting_link} />
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">Student join access</p>
                <ClassroomLockToggle
                  classroomId={classroom.id}
                  effectivelyLocked={isEffectivelyLocked(classroom)}
                  isManualOverride={classroom.join_locked_override !== null}
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
                        <form action={unenrollStudent}>
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
