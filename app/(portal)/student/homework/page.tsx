import { HomeworkSubmitDialog } from "@/components/student/homework-submit-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { HomeworkMode } from "@/lib/supabase/types";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button";
import { withdrawSubmission } from "./actions";

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
          .select("id, classroom_id, title, description, due_date, allowed_modes")
          .in("classroom_id", classroomIds)
          .order("due_date", { ascending: true })
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

  const [{ data: grades }, { data: grants }] = await Promise.all([
    submissionIds.length > 0
      ? supabase.from("homework_grades").select("submission_id, grade, feedback").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] as { submission_id: string; grade: number | null; feedback: string | null }[] }),
    supabase.from("homework_resubmit_grants").select("homework_id").eq("student_id", profile.id),
  ]);
  const gradeBySubmissionId = new Map((grades ?? []).map((g) => [g.submission_id, g]));
  const grantedHomeworkIds = new Set((grants ?? []).map((g) => g.homework_id));

  const currentHomework = (homeworkList ?? []).filter((hw) => !submissionByHomeworkId.has(hw.id));
  const pastHomework = (homeworkList ?? []).filter((hw) => submissionByHomeworkId.has(hw.id));

  function renderCard(hw: NonNullable<typeof homeworkList>[number]) {
    const submission = submissionByHomeworkId.get(hw.id);
    const grade = submission ? gradeBySubmissionId.get(submission.id) : undefined;
    const isPastDue = new Date(hw.due_date) < new Date();
    // Mirrors the database rule (enforce_homework_submission_rules): closed
    // after the due date or once graded, unless the teacher granted a redo.
    const hasGrant = grantedHomeworkIds.has(hw.id);
    const canSubmit = hasGrant || (!isPastDue && !grade);

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

          {canSubmit ? (
            <div className="flex flex-wrap items-center gap-3">
              <HomeworkSubmitDialog
                homeworkId={hw.id}
                title={hw.title}
                studentId={profile.id}
                allowedModes={hw.allowed_modes}
                existingTextAnswer={submission?.text_answer}
                existingVideoPath={submission?.video_url}
                existingAudioPath={submission?.audio_url}
              />
              {submission && !grade && !isPastDue && (
                <ConfirmDeleteButton
                  action={withdrawSubmission.bind(null, hw.id)}
                  label="Withdraw"
                  title="Withdraw your submission?"
                  description="Your answer and any recordings will be deleted. You can submit again before the due date."
                  confirmLabel="Withdraw"
                  successMessage="Submission withdrawn."
                />
              )}
              {hasGrant && <span className="text-xs text-muted-foreground">Your teacher reopened this for you.</span>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {grade
                ? "Graded — resubmission is closed. Ask your teacher if you'd like to resubmit."
                : "The due date has passed, so submissions are closed. Ask your teacher to reopen it."}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" description="Answer with text, video, or audio — whatever your teacher asks for." />

      {(!homeworkList || homeworkList.length === 0) ? (
        <p className="text-sm text-muted-foreground">No homework has been assigned yet.</p>
      ) : (
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Current ({currentHomework.length})</TabsTrigger>
            <TabsTrigger value="past">Past Homework ({pastHomework.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing pending — you&apos;re all caught up.</p>
            ) : (
              currentHomework.map(renderCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">Homework you&apos;ve submitted will show up here.</p>
            ) : (
              pastHomework.map(renderCard)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
