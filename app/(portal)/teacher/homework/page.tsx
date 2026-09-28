import { RotateCcw } from "lucide-react";
import { DeleteRecordButton } from "@/components/finance/delete-record-button";
import { CreateHomeworkForm } from "@/components/teacher/create-homework-form";
import { EditHomeworkDialog } from "@/components/teacher/edit-homework-dialog";
import { GradeSubmissionForm } from "@/components/teacher/grade-submission-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/auth/session";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";
import type { HomeworkMode } from "@/lib/supabase/types";
import { allowResubmission, deleteHomework } from "./actions";
import { PageHeader } from "@/components/portal/page-header";

const MODE_LABEL: Record<HomeworkMode, string> = { text: "Text", audio: "Audio", video: "Video" };

function AllowResubmitButton({
  homeworkId,
  studentId,
  granted,
  label,
}: {
  homeworkId: string;
  studentId: string;
  granted: boolean;
  label: string;
}) {
  if (granted) return <Badge variant="outline">Reopened for this student</Badge>;
  return (
    <form action={allowResubmission}>
      <input type="hidden" name="homeworkId" value={homeworkId} />
      <input type="hidden" name="studentId" value={studentId} />
      <Button type="submit" size="sm" variant="ghost">
        <RotateCcw className="size-3.5" /> {label}
      </Button>
    </form>
  );
}

export default async function TeacherHomeworkPage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));

  const [{ data: homeworkList }, { data: enrollments }] = await Promise.all([
    classroomIds.length > 0
      ? supabase
          .from("homework")
          .select("id, classroom_id, title, description, due_date, allowed_modes")
          .in("classroom_id", classroomIds)
          .order("due_date", { ascending: false })
      : Promise.resolve({
          data: [] as {
            id: string;
            classroom_id: string;
            title: string;
            description: string | null;
            due_date: string;
            allowed_modes: HomeworkMode[];
          }[],
        }),
    classroomIds.length > 0
      ? supabase.from("classroom_students").select("classroom_id, student_id").in("classroom_id", classroomIds)
      : Promise.resolve({ data: [] as { classroom_id: string; student_id: string }[] }),
  ]);

  const homeworkIds = (homeworkList ?? []).map((h) => h.id);
  const [{ data: submissions }, { data: grants }] = await Promise.all([
    homeworkIds.length > 0
      ? supabase
          .from("homework_submissions")
          .select("id, homework_id, student_id, text_answer, video_url, audio_url, submitted_at")
          .in("homework_id", homeworkIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            homework_id: string;
            student_id: string;
            text_answer: string | null;
            video_url: string | null;
            audio_url: string | null;
            submitted_at: string;
          }[],
        }),
    homeworkIds.length > 0
      ? supabase.from("homework_resubmit_grants").select("homework_id, student_id").in("homework_id", homeworkIds)
      : Promise.resolve({ data: [] as { homework_id: string; student_id: string }[] }),
  ]);

  const studentIds = [
    ...new Set([...(submissions ?? []).map((s) => s.student_id), ...(enrollments ?? []).map((e) => e.student_id)]),
  ];
  const submissionIds = (submissions ?? []).map((s) => s.id);
  const [{ data: students }, { data: grades }] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("profiles").select("id, name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    submissionIds.length > 0
      ? supabase.from("homework_grades").select("submission_id, grade, feedback").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] as { submission_id: string; grade: number | null; feedback: string | null }[] }),
  ]);
  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.name]));
  const gradeBySubmissionId = new Map((grades ?? []).map((g) => [g.submission_id, g]));
  const grantKeys = new Set((grants ?? []).map((g) => `${g.homework_id}:${g.student_id}`));

  const mediaPaths = (submissions ?? []).flatMap((s) => [s.video_url, s.audio_url].filter((p): p is string => Boolean(p)));
  const signedUrls = new Map<string, string | null>(
    await Promise.all(mediaPaths.map(async (path) => [path, await createSignedUrl("homework-submissions", path)] as const))
  );

  const submissionsByHomeworkId = new Map<string, NonNullable<typeof submissions>>();
  for (const submission of submissions ?? []) {
    const list = submissionsByHomeworkId.get(submission.homework_id) ?? [];
    list.push(submission);
    submissionsByHomeworkId.set(submission.homework_id, list);
  }
  const studentsByClassroom = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = studentsByClassroom.get(e.classroom_id) ?? [];
    list.push(e.student_id);
    studentsByClassroom.set(e.classroom_id, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" description="Assign homework and review student submissions." />

      <Card>
        <CardHeader>
          <CardTitle>Post new homework</CardTitle>
          <CardDescription>Choose which kinds of answers students can send.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateHomeworkForm classrooms={classrooms ?? []} />
        </CardContent>
      </Card>

      {(homeworkList ?? []).map((hw) => {
        const hwSubmissions = submissionsByHomeworkId.get(hw.id) ?? [];
        const isPastDue = new Date(hw.due_date) < new Date();
        const submittedIds = new Set(hwSubmissions.map((s) => s.student_id));
        const missing = (studentsByClassroom.get(hw.classroom_id) ?? []).filter((id) => !submittedIds.has(id));
        return (
          <Card key={hw.id}>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{hw.title}</CardTitle>
                <CardDescription>
                  {classroomNameById.get(hw.classroom_id) ?? "Classroom"} — due {new Date(hw.due_date).toLocaleString()}
                </CardDescription>
                <div className="flex flex-wrap gap-1 pt-1">
                  {hw.allowed_modes.map((m) => (
                    <Badge key={m} variant="secondary">
                      {MODE_LABEL[m]}
                    </Badge>
                  ))}
                  {isPastDue && <Badge variant="outline">Closed</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <EditHomeworkDialog homework={hw} />
                <DeleteRecordButton
                  action={deleteHomework}
                  fieldName="homeworkId"
                  fieldValue={hw.id}
                  itemLabel={`"${hw.title}" and all of its submissions and grades`}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {hw.description && <p className="text-sm text-muted-foreground">{hw.description}</p>}
              <Separator />
              <p className="text-sm font-medium">Submissions ({hwSubmissions.length})</p>
              {hwSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {hwSubmissions.map((submission) => {
                    const grade = gradeBySubmissionId.get(submission.id);
                    return (
                      <div key={submission.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{studentNameById.get(submission.student_id) ?? "Student"}</p>
                          {(grade || isPastDue) && (
                            <AllowResubmitButton
                              homeworkId={hw.id}
                              studentId={submission.student_id}
                              granted={grantKeys.has(`${hw.id}:${submission.student_id}`)}
                              label="Allow resubmission"
                            />
                          )}
                        </div>
                        {submission.text_answer && <p className="mt-1 text-muted-foreground">{submission.text_answer}</p>}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {submission.video_url && signedUrls.get(submission.video_url) && (
                            <video src={signedUrls.get(submission.video_url)!} controls className="h-32 rounded-md" />
                          )}
                          {submission.audio_url && signedUrls.get(submission.audio_url) && (
                            <audio src={signedUrls.get(submission.audio_url)!} controls />
                          )}
                        </div>
                        <div className="mt-3">
                          <GradeSubmissionForm
                            submissionId={submission.id}
                            existingGrade={grade?.grade}
                            existingFeedback={grade?.feedback}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {isPastDue && missing.length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm font-medium">Didn&apos;t submit ({missing.length})</p>
                  <ul className="space-y-1">
                    {missing.map((studentId) => (
                      <li key={studentId} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                        <span>{studentNameById.get(studentId) ?? "Student"}</span>
                        <AllowResubmitButton
                          homeworkId={hw.id}
                          studentId={studentId}
                          granted={grantKeys.has(`${hw.id}:${studentId}`)}
                          label="Allow late submission"
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
