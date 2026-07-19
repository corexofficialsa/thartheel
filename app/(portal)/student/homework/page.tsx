import { HomeworkSubmissionForm } from "@/components/student/homework-submission-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function StudentHomeworkPage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_id", profile.id);
  const classroomIds = (enrollments ?? []).map((e) => e.classroom_id);

  const [{ data: classrooms }, { data: homeworkList }] = await Promise.all([
    classroomIds.length > 0
      ? supabase.from("classrooms").select("id, name").in("id", classroomIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    classroomIds.length > 0
      ? supabase
          .from("homework")
          .select("id, classroom_id, title, description, due_date")
          .in("classroom_id", classroomIds)
          .order("due_date", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; classroom_id: string; title: string; description: string | null; due_date: string }[] }),
  ]);

  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));
  const homeworkIds = (homeworkList ?? []).map((h) => h.id);

  const { data: submissions } =
    homeworkIds.length > 0
      ? await supabase
          .from("homework_submissions")
          .select("id, homework_id, text_answer, video_url, audio_url")
          .eq("student_id", profile.id)
          .in("homework_id", homeworkIds)
      : { data: [] as { id: string; homework_id: string; text_answer: string | null; video_url: string | null; audio_url: string | null }[] };

  const submissionByHomeworkId = new Map((submissions ?? []).map((s) => [s.homework_id, s]));
  const submissionIds = (submissions ?? []).map((s) => s.id);

  const { data: grades } =
    submissionIds.length > 0
      ? await supabase.from("homework_grades").select("submission_id, grade, feedback").in("submission_id", submissionIds)
      : { data: [] as { submission_id: string; grade: number | null; feedback: string | null }[] };
  const gradeBySubmissionId = new Map((grades ?? []).map((g) => [g.submission_id, g]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Homework</h1>
        <p className="text-muted-foreground">Answer with text, video, or audio — whatever your teacher asks for.</p>
      </div>

      {(!homeworkList || homeworkList.length === 0) && (
        <p className="text-sm text-muted-foreground">No homework has been assigned yet.</p>
      )}

      <div className="space-y-4">
        {(homeworkList ?? []).map((hw) => {
          const submission = submissionByHomeworkId.get(hw.id);
          const grade = submission ? gradeBySubmissionId.get(submission.id) : undefined;
          const isPastDue = new Date(hw.due_date) < new Date();

          return (
            <Card key={hw.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{hw.title}</CardTitle>
                  <CardDescription>
                    {classroomNameById.get(hw.classroom_id) ?? "Classroom"} — due{" "}
                    {new Date(hw.due_date).toLocaleString()}
                  </CardDescription>
                </div>
                {submission ? (
                  <Badge variant={grade ? "default" : "secondary"}>{grade ? "Graded" : "Submitted"}</Badge>
                ) : (
                  <Badge variant={isPastDue ? "destructive" : "outline"}>{isPastDue ? "Overdue" : "Pending"}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {hw.description && <p className="text-sm text-muted-foreground">{hw.description}</p>}

                {grade && (
                  <div className="rounded-md border bg-secondary/40 p-3 text-sm">
                    <p className="font-medium">
                      Grade: {grade.grade ?? "—"}
                    </p>
                    {grade.feedback && <p className="mt-1 text-muted-foreground">{grade.feedback}</p>}
                  </div>
                )}

                <HomeworkSubmissionForm
                  homeworkId={hw.id}
                  studentId={profile.id}
                  existingTextAnswer={submission?.text_answer}
                  existingVideoPath={submission?.video_url}
                  existingAudioPath={submission?.audio_url}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
